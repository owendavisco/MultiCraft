const net = require('net');
const EventEmmiter = require('EventEmitter');

class ProxyServer extends EventEmmiter {
    constructor() {
        this.clients = {};
        this.servers = {};
        this.socketServer = null;
    }

    listen(port, serverIps) {

    }
}

module.exports = ProxyServer;