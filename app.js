var debug = require('debug')('MultiCraft:app');
var http = require('http');
var createProxyServer = require('./server/createProxyServer');
var express = require('express');

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

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;

    proxyServer = createProxyServer(8080, {
        'host': '192.168.1.3',
        'port': 25565
    });
    setTimeout(test, 10000);
}

function test() {
    proxyServer.migrateServer({
        'host': '192.168.1.3',
        'port': 25564
    });
}