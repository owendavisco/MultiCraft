'use strict'

const url = require('url');
const AWS = require('aws-sdk');
const fs = require('fs');
const METRIC = require('./Metrics');

const awsDefaultConfig = { region: 'us-east-1' };
const defaultInstanceType = 't2.micro';

class AwsClient {

    constructor(conf) {
        let config = conf || awsDefaultConfig;
        this.ec2 = new AWS.EC2(config);
        this.cloudWatch = new AWS.CloudWatch(config);

        this.cloudWatchParams = {
            Dimensions: [
                {
                    Name: 'InstanceId',
                    Value: 'STRING_VALUE'
                },
            ],
            MetricName: METRIC.CPUUtilization
        };

        this.ec2Params = {
            ImageId: 'ami-aaeaedbd',
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
            IamInstanceProfile: {
                Arn: 'arn:aws:iam::803026361943:instance-profile/MinecraftServer'
            },
            MinCount: 1,
            MaxCount: 1
        };
    }

    getMetric(instanceId, metric, callback) {
        if (!instanceId || !metric) {
            throw new Error('Both Instance Id and metric type are required');
        }
        let params = this.cloudWatchParams;
        params.Dimensions[0].Value = instanceId;
        params.MetricName = metric;

        this.cloudWatch.listMetrics(params, callback);
    }

    createEc2Instance(instanceType, callback) {
        let params = this.ec2Params;
        params.InstanceType = instanceType || defaultInstanceType;

        this.ec2.runInstances(params, (err, data) => {
            if(err) {
                callback(err);
                return;
            }
            callback(err, data.Instances[0])
        });
    }

    getEc2Information(instanceId, callback) {
        let params = { InstanceIds: [instanceId] };

        this.ec2.describeInstances(params, (err, data) => {
            if(err) {
                callback(err);
                return;
            }
            callback(err, data.Reservations[0].Instances[0]);
        });
    }
}

module.exports = AwsClient;