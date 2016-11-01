'use strict';

const ProxyServer = require('./ProxyServer');
const BasePacket = require('../packet/BasePacket');
const VarNum = require('../packet/dataTypes/VarNum');
const net = require('net');
const crypto = require('crypto');

function createProxyServer(port, minecraft) {
    let minecraftServer = minecraft || { 'host':'localhost', 'port':25565 };
    let proxyPort = port;

    var proxyServer = new ProxyServer();

    var clientBuffers = {};

    proxyServer.listen(proxyPort, minecraftServer);
    console.log(`Listening on port ${proxyPort}`);

    proxyServer.on('connection', handleConnPipeline);

    proxyServer.on('migrateServer', (newServerOptions) => {
        let currentConnection;
        let newServer;
        for(let connId in proxyServer.connections) {
            currentConnection = proxyServer.connections[connId];
            // clientBuffers[connId] = [];

            newServer = net.createConnection(newServerOptions.port, newServerOptions.host, () => {
                console.log(`Connected to new server with hostname:port - ${newServerOptions.host}:${newServerOptions.port}`);
            });

            currentConnection.server = newServer;

            handleClientLogin(currentConnection.client, currentConnection.server);

            // currentConnection.client.on('data', data => {
            //     clientBuffers[connId].push(data);
            // });
        }
    });

    return proxyServer;
}

function handleClientLogin(client, server) {
    let currentState = 'start';
    let publicKey;
    let verifyToken;
    server.write(client.loginPacket);
    server.on('data', data => {
        if(currentState == 'start') {

        }
    });
}

function handleConnPipeline(client, server) {

    function printBuffer(array, name) {
        let currentPacket;
        for(let i = 0; i < array.length; i++) {
            currentPacket = array[i];
            let str = '';
            let packetStr = '';
            for (let e of currentPacket) {
                packetStr = e.toString(2);
                str += ('0'.repeat(8-packetStr.length) + packetStr) + ' ';
            }
            console.log(`${name} ${i} (length ${currentPacket.length}): ${str}`);
        }
    }

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
}

module.exports = createProxyServer;