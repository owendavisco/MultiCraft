'use strict';

const deployMinecraft = require('./DeployMinecraft');

function migrateMinecraft(instanceType, proxyClient, callback) {
    if(!instanceType) {
        throw new Error('Migrate minecraft requires an instance type to migrate to...');
    }

    deployMinecraft({ instanceType: instanceType }, (err, ec2Instance) => {
        proxyClient.migrateProxyServer(ec2Instance.PublicDnsName, 25565, callback);
    });
}

module.exports = migrateMinecraft;
