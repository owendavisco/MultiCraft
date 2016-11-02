var debug = require('debug')('MultiCraft:app');
var http = require('http');
var createProxyServer = require('./server/createProxyServer');
var express = require('express');
var child_process = require('child_process');
var path = require('path');

var app = express();
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);


var server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }

    if (port >= 0) {
        return port;
    }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    switch (error.code) {
      case 'EACCES':
          console.error(bind + ' requires elevated privileges');
          process.exit(1);
          break;
      case 'EADDRINUSE':
          console.error(bind + ' is already in use');
          process.exit(1);
          break;
        default:
            throw error;
  }
}

var proxyServer;
var minecraftServerPath = 'C:/Users/Owen\ Davis/Desktop/Server\ (1)/';

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;

    process.chdir(minecraftServerPath);
    proxyServer = createProxyServer(8080, {
        'host': 'localhost',
        'port': 25565
    });
    console.log('Migrating Servers in 10 seconds...')
    setTimeout(migrateServers, 10000);
}

function migrateServers() {
    console.log('Server Migration Started');
    var minecraftServer = child_process.spawn('java', ['-jar', 'minecraft_server.1.10.2.jar']);
    minecraftServer.stdout.on('data', data => {
        data = data.toString();
        if(data.includes('Done')) {
            console.log('New minecraft server started, starting player migration...');
            migrateToNewServer();
            minecraftServer.removeAllListeners();
        }
    });
}

function migrateToNewServer() {
    proxyServer.migrateServer({
        'host': 'localhost',
        'port': 25564
    });
}