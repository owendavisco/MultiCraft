'use strict';

const ProxyServer = require('./ProxyServer');

function createProxyServer(options) {
    options = options || {};
    let minecraftServer = { 'host':'localhost', 'port':25565 };
    let proxyPort = options.port || 8080;

    var proxyServer = new ProxyServer();

    proxyServer.listen(proxyPort, minecraftServer);

    proxyServer.on('connection', (client, server) => {
        server.on('data', data => {
            client.write(data);
        });
        client.on('data', data => {
            server.write(data);
        });
    });

    return proxyServer;
}

module.exports = createProxyServer;