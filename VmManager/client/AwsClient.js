'use strict'

const url = require('url');
const AWS = require('aws-sdk');
const fs = require('fs');

const awsDefaultConfig = { region: 'us-east-1' };
const defaultInstanceType = 't1.micro';
const usrData = new Buffer(fs.readFileSync('./script/Startup.sh')).toString('base64');

class AwsClient {

    constructor(conf) {
        let config = conf || awsDefaultConfig;
        this.ec2 = new AWS.EC2(config);
        this.cloudWatch = new AWS.CloudWatch(config);

        this.ec2Params = {
            ImageId: 'ami-b73b63a0',
            InstanceType: defaultInstanceType,
            Monitoring: {
                Enabled: true
            },
            KeyName: 'MinecraftServerKey',
            NetworkInterfaces: [
                {
                    AssociatePublicIpAddress: true,
                    Groups: [
                        'sg-0626ad63',
                        'sg-ab3ba0d6'
                    ],
                    DeviceIndex: 0,
                    SubnetId: 'subnet-1aab8632'
                }
            ],
            UserData: usrData,
            MinCount: 1,
            MaxCount: 1
        };
    }

    getMetric(metric) {

    }

    createEc2Instance(instanceType, callback) {
        let params = this.ec2Params;
        params.InstanceType = instanceType || defaultInstanceType;

        this.ec2.runInstances(params, function(err, data) {
            if (err) {
                console.log("Could not create instance", err);
                return;
            }
            var instanceId = data.Instances[0].InstanceId;

            if(callback) {
                callback(instanceId);
            }
        });
    }

    getEc2BootStatus() {

    }
}

module.exports = AwsClient;