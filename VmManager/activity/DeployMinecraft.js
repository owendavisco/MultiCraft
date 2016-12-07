'use strict';
const SSHClient = require('ssh2').Client;
const AWSClient = require('../client/AwsClient');
const child_process = require('child_process');
const fs = require('fs');

const mountPath = 'efs';
const mountCommand = `sudo mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone).fs-e89143a1.efs.us-east-1.amazonaws.com:/ ${mountPath}`;
const memTotal = `$(grep 'MemTotal' /proc/meminfo | grep -o '[0-9]*')`;
const memFree = `$(grep 'MemFree' /proc/meminfo | grep -o '[0-9]*')`;
const runMinecraftCommand = `sudo java -jar -Xms${memFree}k -Xmx${memTotal}k minecraft_server.1.10.jar nogui`;

const defaultOptions = {
    instanceType: 't2.micro'
};

const awsClient = new AWSClient();

var ec2Instance = null;
var deploymentCallback = function(err, instance) {
    if(err) {
        console.log("Error deploying minecraft server...");
        console.log(err.message);
        return;
    }
    console.log(`Deployment Completed Successfully for instance with hostname ${instance.PublicDnsName}`);
};

function deployMinecraft(options, callback) {
    deploymentCallback = callback || deploymentCallback;
    options = options || defaultOptions;

    console.log("Creating ec2 Instance");
    awsClient.createEc2Instance(options.instanceType, (err, instance) => {
        if(err) {
            deploymentCallback(err);
            return;
        }
        getInstanceIp(instance.InstanceId, configureVm);
    });
}

function getInstanceIp(instanceId, callback) {
    awsClient.getEc2Information(instanceId, (err, data) => {
        if(err) {
            deploymentCallback(err);
            return;
        }
        if(data.PublicDnsName != "") {
            callback(data);
            return;
        }
        getInstanceIp(instanceId, callback);
    });
}

function configureVm(instance) {
    console.log("Successfully Created ec2 instance, configuring VM and starting minecraft");
    let sshClient = new SSHClient();
    let connParams = {
        host: instance.PublicDnsName,
        port: 22,
        username: 'ec2-user',
        privateKey: fs.readFileSync('./MinecraftServerKey.pem')
    };

    sshClient.on('ready', () => {
        ec2Instance = instance;
        mkdir(sshClient);
    });
    sshClient.on('error', (err) => {
        console.log("Connection to instance failed, retrying in 5 seconds...");
        setTimeout(() => {
            sshClient.connect(connParams);
        }, 5000);
    });

    sshClient.connect(connParams);
}

function mkdir(sshClient) {
    console.log("Creating network file system mount");
    sshClient.exec('mkdir efs', { allowHalfOpen: false }, (err, stream) => {
        if(err) {
            deploymentCallback(err);
            return;
        }
        addDefaultStreamListeners(stream);
        stream.on('close', (code, signal) => {
            console.log("Executed command mkdir efs");
            mountDir(sshClient)
        });
    });
}

function mountDir(sshClient) {
    sshClient.exec(mountCommand, { allowHalfOpen: false }, (err, stream) => {
        if(err) {
            deploymentCallback(err);
            return;
        }
        addDefaultStreamListeners(stream);
        stream.on('close', (code, signal) => {
            console.log("Executed command mount efs");
            startMinecraft(sshClient);
        });
    });
}

function startMinecraft(sshClient) {
    console.log("Starting minecraft server");
    sshClient.exec(`cd efs && ${runMinecraftCommand}`, (err, stream) => {
        if(err) {
            deploymentCallback(err);
            return;
        }
        stream.on('data', (data) => {
            data = data.toString();
            console.log(`${data}`);
            if(data.includes('Done')) {
                console.log('New minecraft server started successfully!');
                sshClient.end();
                deploymentCallback(null, ec2Instance);
            }
        })
    })
}

function addDefaultStreamListeners(stream) {
    stream.on('data', function(data) {
        console.log(`STDOUT: ${data.toString()}`);
    });
    stream.stderr.on('data', function(data) {
        console.log(`STDERR: ${data.toString()}`);
    });
}

module.exports = deployMinecraft;
