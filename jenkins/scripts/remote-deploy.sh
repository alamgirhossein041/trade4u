#!/bin/sh


#=====================================
# HOST_IP  controlled by jenkins env
# HOST_USER controlled by jenkins envs
# PORT controlled by jenkins envs
#=====================================

# Get current git commit number
LABEL=$(git log -1 --format=%h)

CONTAINER_NAME=binance_plus-backend
CONTAINER_CURRENT=rnssolutions/$CONTAINER_NAME:$LABEL

docker stop $CONTAINER_NAME-$BRANCH_NAME
docker rm -f $CONTAINER_NAME-$BRANCH_NAME
docker run -v /var/binance-plus/.env:/app/.env  -v /var/binance-plus/keystore:/app/database  -d -p $PORT:3837 --name $CONTAINER_NAME-$BRANCH_NAME $CONTAINER_CURRENT
