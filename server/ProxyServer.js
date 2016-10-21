'use strict';

const net = require('net');
const debug = require('debug')('MultiCraft:ProxyServer');
const EventEmitter = require('events').EventEmitter;

class ProxyServer extends EventEmitter {
    constructor() {
        super();
        this.clients = {};
        this.socketServer = null;
    }

    listen(port, server) {
        const self = this;
        let clientId = 0;

        self.socketServer = net.createServer();
        self.socketServer.on('connection', socket => {
            console.log(`Connected to client with hostname:port - ${socket.localAddress}:${socket.localPort}`);
            self.clients[clientId] = socket;

            socket.state = 'login';
            socket.id = clientId;

            let serverConnection = net.createConnection(server.port, server.host, () => {
                console.log(`Connected to server with hostname:port - ${server.host}:${server.port}`);
            });

            clientId++;

            self.emit('connection', socket, serverConnection);
        });
        self.socketServer.on('error', err => {
            self.emit('error', err);
        });
        self.socketServer.on('close', () => {
            self.emit('close');
        });
        self.socketServer.on('listening', () => {
            self.emit('listening');
        });

        self.socketServer.listen(port);
    }
}

module.exports = ProxyServer;