'use strict';

const net = require('net');

const actions = {
    START: 'START',
    STOP: 'STOP',
    MIGRATE: 'MIGRATE'
}

class MinecraftProxyClient {
    constructor(hostnameIp, port, callback) {
        if(!hostnameIp) {
            throw new Error('The minecraft proxy client requires a valid hostname or ip');
        }
        port = port || 3000;
        this.proxyConnection = net.createConnection(port, hostnameIp, callback || () => {
            console.log(`Connected to proxy server with hostname or ip ${hostnameIp}`);
        });
    }

    startProxyServer(minecraftHostnameIp, minecraftPort) {
        let jsonRequest = {
            action: actions.START,
            content: {
                host: minecraftHostnameIp,
                port: minecraftPort || 25565
            }
        }
        this.proxyConnection.write(JSON.stringify(jsonRequest));
    }

    migrateProxyServer(minecraftHostnameIp, minecraftPort) {
        let jsonRequest = {
            action: actions.MIGRATE,
            content: {
                host: minecraftHostnameIp,
                port: minecraftPort || 25565
            }
        }
        this.proxyConnection.write(JSON.stringify(jsonRequest));
    }

    stopProxyServer() {
        let jsonRequest = { action: actions.STOP };
        this.proxyConnection.write(JSON.stringify(jsonRequest));
    }
}

module.exports = MinecraftProxyClient;
