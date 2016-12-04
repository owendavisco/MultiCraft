var debug = require('debug')('VmManager:app');
var express = require('express');
var AWS = require('aws-sdk');
var awsClient = require('./client/AwsClient');
var METRIC = require('./client/Metrics');
var deployMinecraft = require('./activity/DeployMinecraft');

var app = express();

deployMinecraft();

// var client = new awsClient();
// client.createEc2Instance('t2.micro', function(instanceId) {
//    console.log(`Created instance with id ${instanceId}`);
// });

// client.getMetric('i-dbb275cc', METRIC.CPUUtilization);