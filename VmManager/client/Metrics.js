'use strict'

//http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/mon-scripts.html needed
//Also need detailed monitoring in order to test different instances
const Metrics = {
    CPUCreditUsage: 'CPUCreditUsage',
    CPUCreditBalance: 'CPUCreditBalance',
    CPUUtilization: 'CPUUtilization',
    DiskReadOps: 'DiskReadOps',
    DiskWriteOps: 'DiskWriteOps',
    DiskReadBytes: 'DiskReadBytes',
    NetworkIn: 'NetworkIn',
    NetworkOut: 'NetworkOut',
    NetworkPacketsIn: 'NetworkPacketsIn',
    NetworkPacketsOut: 'NetworkPacketsOut',
    MemoryUtilization: 'MemoryUtilization',
    MemoryUsed: 'MemoryUsed'
}

module.exports = Metrics;