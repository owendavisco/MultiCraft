'use strict';

const ProxyServer = require('./ProxyServer');
const BasePacket = require('../packet/BasePacket');
const VarNum = require('../packet/dataTypes/VarNum');

function createProxyServer(options) {
    options = options || {};
    let minecraftServer = { 'host':'localhost', 'port':25565 };
    let proxyPort = options.port || 8080;

    var proxyServer = new ProxyServer();
    var serverBuffer = [];
    var clientBuffer = [];

    var packetCount = 0;

    proxyServer.listen(proxyPort, minecraftServer);

    proxyServer.on('connection', (client, server) => {

        function printBuffer(array, name) {
            let currentPacket;
            for(let i = 0; i < array.length; i++) {
                currentPacket = array[i];
                let str = '';
                for (let e of currentPacket) {
                    str += e.toString(2) + ' ';
                }
                console.log(`${name} ${i} (length ${currentPacket.length}): ${str}`);
            }
        }

        server.on('data', data => {
            serverBuffer.push(data);
            client.write(data);

            if(serverBuffer.length == 2) {
                console.log('Printing Server Packets');
                printBuffer(serverBuffer, 'Server');
            }
        });
        client.on('data', data => {
            clientBuffer.push(data);
            server.write(data);

            if(clientBuffer.length == 3) {
                console.log('Printing Client Packets');
                printBuffer(clientBuffer, 'Client');
            }
        });
    });

    return proxyServer;
}

module.exports = createProxyServer;