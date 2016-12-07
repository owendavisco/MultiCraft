var debug = require('debug')('VmManager:app');
var express = require('express');
var AWS = require('aws-sdk');
var awsClient = require('./client/AwsClient');
var METRIC = require('./client/Metrics');
var ProxyClient = require('./client/MinecraftProxyClient');
var migrateMinecraft = require('./activity/MigrateMinecraft');
var deployMinecraft = require('./activity/DeployMinecraft');

var app = express();

// var proxyClient = new ProxyClient('localhost', 3000, () => {
//     proxyClient.startProxyServer('54.208.195.242', 25565);
// });
//
// setTimeout(() => {
//     console.log('VM migration started');
//     migrateMinecraft('t2.micro', proxyClient);
// }, 30000);

deployMinecraft();

// var client = new awsClient();

// client.getMetric('i-dbb275cc', METRIC.CPUUtilization);