'use strict';

const net = require('net');

const Actions = require('./Actions');
const Responses = require('./Responses');

class MinecraftProxyClient {
    constructor(hostnameIp, port, callback) {
        if(!hostnameIp) {
            throw new Error('The minecraft proxy client requires a valid hostname or ip');
        }
        port = port || 3000;
        this.proxyConnection = net.createConnection(port, hostnameIp, callback || () => {
            console.log(`Connected to proxy server with hostname or ip ${hostnameIp}`);
        });
        this.proxyConnection.on('error', () => {
            console.log('Connection with proxy server lost');
        });
    }

    startProxyServer(minecraftHostnameIp, minecraftPort, callback) {
        minecraftPort = minecraftPort || 25565
        let jsonRequest = {
            action: Actions.START,
            content: {
                host: `${minecraftHostnameIp}:${minecraftPort}`
            }
        }
        this.proxyConnection.write(JSON.stringify(jsonRequest));
        this.proxyConnection.once('data', (dataString) => {
            handleResponse(dataString, callback);
        });
    }

    migrateProxyServer(minecraftHostnameIp, minecraftPort, callback) {
        minecraftPort = minecraftPort || 25565
        let jsonRequest = {
            action: Actions.MIGRATE,
            content: {
                host: `${minecraftHostnameIp}:${minecraftPort}`
            }
        }
        this.proxyConnection.write(JSON.stringify(jsonRequest));
        this.proxyConnection.once('data', (dataString) => {
            handleResponse(dataString, callback);
        });
    }

    stopProxyServer() {
        let jsonRequest = { action: Actions.STOP };
        this.proxyConnection.write(JSON.stringify(jsonRequest));
    }
}

function handleResponse(dataString, callback) {
    try {
        let data = JSON.parse(dataString);
        if (data.responseCode == Responses.COMPLETED) {
            callback(null, data.message);
        }
        else {
            callback(data.message, null);
        }
    }
    catch (e) {
        callback(null, `Error parsing response from proxy server: ${e}`);
    }
}

module.exports = MinecraftProxyClient;
