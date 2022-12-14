#!/bin/sh


#=====================================
# HOST_IP  controlled by jenkins env
# HOST_USER controlled by jenkins envs
# PORT controlled by jenkins envs
#=====================================

# Get current git commit number
LABEL=$(git log -1 --format=%h)

CONTAINER_NAME=trade4u-backend
CONTAINER_CURRENT=rnssolutions/$CONTAINER_NAME:$LABEL

docker stop $CONTAINER_NAME-$BRANCH_NAME
docker rm -f $CONTAINER_NAME-$BRANCH_NAME
docker run  -v /var/trade4u/secret-manager.json:/app/secret-manager.json -v /var/trade4u/.env:/app/.env  -v /var/trade4u/keystore:/app/database  -d -p $PORT:4000 -p $SOCKET_PORT:3834 --restart unless-stopped --name $CONTAINER_NAME-$BRANCH_NAME $CONTAINER_CURRENT
