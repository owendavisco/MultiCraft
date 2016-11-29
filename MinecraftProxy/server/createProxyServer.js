'use strict';

const ProxyServer = require('./ProxyServer');
const BasePacket = require('../packet/BasePacket');
const VarNum = require('../packet/dataTypes/VarNum');
const net = require('net');

function createProxyServer(port, minecraft) {
    let minecraftServer = minecraft || { 'host':'localhost', 'port':25565 };
    let proxyPort = port;

    var proxyServer = new ProxyServer();

    proxyServer.listen(proxyPort, minecraftServer);
    console.log(`Listening on port ${proxyPort}`);

    proxyServer.on('connection', handleConnPipeline);

    proxyServer.on('migrateServer', (newServerOptions) => {
        let currentConnection;
        let newServer, oldServer;
        proxyServer.minecraftServer = newServerOptions;

        for(let connId in proxyServer.connections) {
            bufferClientWrites(proxyServer.connections[connId].client, proxyServer.connections[connId].server);
        }
        for(let connId in proxyServer.connections) {
            currentConnection = proxyServer.connections[connId];

            newServer = net.createConnection(newServerOptions.port, newServerOptions.host, () => {
                console.log(`Connected to new server with hostname:port - ${newServerOptions.host}:${newServerOptions.port}`);
            });

            currentConnection.server = newServer;

            handleClientLogin(currentConnection.client, currentConnection.server);
        }
    });

    return proxyServer;
}

function bufferClientWrites(client, oldServer) {
    oldServer.removeAllListeners();
    client.removeAllListeners();

    oldServer.destroy();

    client.packetBuffer = [];
    client.on('data', data => {
        client.packetBuffer.push(data);
    });
}

function handleClientLogin(client, server) {
    let isComplete = false;
    let currentPackets = 0;

    server.write(client.loginPacket);
    server.on('data', data => {
        if(!isComplete && data.length >= 256) {
            let clientBuffer = client.packetBuffer;
            for(let packet of clientBuffer) {
                server.write(packet);
            }
            client.write(data);
            handleConnPipeline(client, server);
            client.packetBuffer = [];
            isComplete = true;

            console.log('Client server migration completed!');
        }
        currentPackets++;
    });
}

function handleConnPipeline(client, server) {
    client.removeAllListeners();
    server.removeAllListeners();

    let clientHostname = `${client.remoteAddress}:${client.localPort}`;
    let serverHostname = `${server.localAddress}:${server.localPort}`;

    server.on('data', data => {
        if(!client.destroyed) {
            client.write(data);
        }
    });
    client.on('data', data => {
        if(!server.destroyed) {
            if (client.state == 'login') {
                client.loginPacket = data;
                client.state = 'play';
            }
            server.write(data);
        }
    });

    server.on('error', err => {
        console.log(`Connection with server ${serverHostname} suddenly closed! Disposing of connection...`);
        server.destroy();
        client.destroy();
    });
    client.on('error', err => {
        console.log(`Connection with client ${clientHostname} suddenly closed! Disposing of connection...`);
        server.destroy();
        client.destroy();
    });
}

module.exports = createProxyServer;