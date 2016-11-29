var debug = require('debug')('VmManager:app');
var express = require('express');
var child_process = require('child_process');
var path = require('path');
var net = require('net');

var app = express();

var proxyServer;
var proxyPort = process.argv[2];