'use strict';

const net = require('net');
const debug = require('debug')('MultiCraft:ProxyServer');
const EventEmitter = require('events').EventEmitter;

class ProxyServer extends EventEmitter {
    constructor() {
        super();
        this.connections = {};
        this.socketServer = null;
    }

    listen(port, server) {
        const self = this;
        let connectionId = 0;

        self.socketServer = net.createServer();
        self.socketServer.on('connection', socket => {
            console.log(`Connected to client with hostname:port - ${socket.localAddress}:${socket.localPort}`);
            self.connections[connectionId] = {};
            self.connections[connectionId].client = socket;

            socket.state = 'login';

            let serverConnection = net.createConnection(server.port, server.host, () => {
                console.log(`Connected to server with hostname:port - ${server.host}:${server.port}`);
            });
            self.connections[connectionId].server = serverConnection;

            self.emit('connection', socket, serverConnection, connectionId);

            connectionId++;
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

    migrateServer(newServer) {
        this.emit('migrateServer', newServer);
    }
}

module.exports = ProxyServer;