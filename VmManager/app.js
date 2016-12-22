var debug = require('debug')('VmManager:app');
var express = require('express');
var AWS = require('aws-sdk');
var awsClient = require('./client/AwsClient');
var METRIC = require('./client/Metrics');
var ProxyClient = require('./client/MinecraftProxyClient');
var migrateMinecraft = require('./activity/MigrateMinecraft');
var deployMinecraft = require('./activity/DeployMinecraft');

var proxyClient = new ProxyClient('localhost', 3000, () => {
    proxyClient.startProxyServer('ec2-54-152-190-177.compute-1.amazonaws.com', 25565, (err, data) => {
        if(err) {
            console.log(`Error when starting minecraft proxy: ${err}`);
            return;
        }
        console.log(`Minecraft proxy started successfully: ${data}`);
    });
});
//
// setTimeout(() => {
//     console.log("Migration Started")
//     proxyClient.migrateProxyServer('localhost', 25564, (err, data) => {
//         if(err) {
//             console.log(`Error when migrating minecraft proxy: ${err}`);
//             return;
//         }
//         console.log(`Minecraft proxy migrated successfully: ${data}`);
//     })
// }, 120000);

setTimeout(() => {
    console.log('VM migration started');
    migrateMinecraft('t2.micro', proxyClient, (data, err) => {
        if(err) {
            console.log(`Error when migrating minecraft proxy: ${err}`);
            return;
        }
        console.log('Minecraft proxy migrated servers successfully');
    });
}, 30000);

//deployMinecraft();

// var client = new awsClient();

// client.getMetric('i-dbb275cc', METRIC.CPUUtilization);