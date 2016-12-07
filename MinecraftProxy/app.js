var debug = require('debug')('MinecraftProxy:app');
var createProxyServer = require('./server/createProxyServer');
var express = require('express');
var child_process = require('child_process');
var path = require('path');
var net = require('net');

var port = normalizePort(process.env.PORT || '3000');

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

var server = net.createServer();
server.on('error', onError);
server.on('listening', onListening);
server.on('connection', onConnection);
server.listen(port);

var proxyServer;
var proxyPort = process.argv[2];

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? addr : ':' + addr.port;

    console.log(`Server listening on localhost${bind}...`);
}

function onConnection(socket) {
    socket.on('data', (dataString) => {
        handleRequest(dataString, (err, data) => {
            if(err) {
                var response = {
                    responseCode: 'FAILED',
                    message: err
                }
                socket.write(JSON.stringify(response));
            }
            else {
                var response = {
                    responseCode: 'COMPLETED',
                    message: data
                }
                socket.write(JSON.stringify(response));
            }
        })
    });
}

function handleRequest(dataString, callback) {
    var data = JSON.parse(dataString);
    if(data && data.action) {
        switch (data.action) {
            case 'START':
                console.log('Starting Minecraft Proxy Server...');
                proxyServer = createProxyServer(proxyPort, data.content, callback);
                break;
            case 'STOP':
                console.log('Stopping Minecraft Proxy Server...');
                proxyServer = null;
                break;
            case 'MIGRATE':
                console.log('Starting Server Migration...');
                proxyServer.migrateServer(data.content, callback);
                break;
        }
    }
}