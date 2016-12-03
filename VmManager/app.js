var debug = require('debug')('VmManager:app');
var express = require('express');
var AWS = require('aws-sdk');
var awsClient = require('./client/AwsClient');

var app = express();

var client = new awsClient();
client.createEc2Instance('t1.micro', function(instanceId) {
   console.log(`Created instance with id ${instanceId}`);
});

// var ec2 = new AWS.EC2({region: 'us-east-1'});
//
// var usrData = new Buffer(`#!/bin/bash
// mkdir /root/efs
// sudo mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone).fs-e89143a1.efs.us-east-1.amazonaws.com:/ efs
// touch /root/hello
// `).toString('base64');
//
// var params = {
//     ImageId: 'ami-1624987f',
//     InstanceType: 't1.micro',
//     Monitoring: {
//         Enabled: true
//     },
//     KeyName: 'MinecraftServerKey',
//     NetworkInterfaces: [
//         {
//             AssociatePublicIpAddress: true,
//             Groups: [
//                 'sg-0626ad63',
//                 'sg-ab3ba0d6'
//             ],
//             DeviceIndex: 0,
//             SubnetId: 'subnet-1aab8632'
//         }
//     ],
//     UserData: usrData,
//     MinCount: 1,
//     MaxCount: 1
// };
//
// // Create the instance
// ec2.runInstances(params, function(err, data) {
//     if (err) {
//         console.log("Could not create instance", err);
//         return;
//     }
//     var instanceId = data.Instances[0].InstanceId;
//     console.log("Created instance", instanceId);
// });