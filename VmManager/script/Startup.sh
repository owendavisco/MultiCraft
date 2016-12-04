#!/bin/bash
mkdir /root/efs
mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone).fs-e89143a1.efs.us-east-1.amazonaws.com:/ efs
