'use strict';

const net = require('net');
const EventEmitter = require('events').EventEmitter;

class ProxyServer extends EventEmitter {
    constructor() {
        super();
        this.clients = {};
        this.servers = {};
        this.socketServer = null;
    }

    listen(port, servers) {
        const self = this;
        let clientId = 0;
        let serverId = 0;

        for (let server of servers) {
            self.servers[serverId] = net.connect(server.port, server.host, function(){
                console.log("Connected To Server");
            });
            serverId++;
        }

        self.socketServer = net.createServer();
        self.socketServer.on('connection', socket => {
            console.log("Connection received");
            self.clients[clientId] = socket;

            socket.pipe(self.servers[0]);
            self.servers[0].pipe(socket);

            // socket.on('data', data => {
            //    for (let i = 0; i < serverId; i++) {
            //        var server = self.servers[0];
            //        server.write(data);
            //    }
            // });

            self.socketServer.on('error', err => {
                self.emit('error', err);
            });
            self.socketServer.on('close', () => {
                self.emit('close');
            });
            self.socketServer.on('listening', () => {
                self.emit('listening');
            });
        });
        self.socketServer.listen(port);
    }
}

module.exports = ProxyServer;

function main() {
    const server = new ProxyServer();
    server.listen(8080, [{
            'port': 25565,
            'host': 'localhost'
        },
        {
            'port': 25564,
            'host': 'localhost'
        }]);
}

main();