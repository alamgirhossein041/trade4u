#!/bin/sh

# Default git commit number
GIT_COMMIT=unspecified
# Get current git commit number
LABEL=$(git log -1 --format=%h)
# Build docker of current directory
echo "Build docker image with label "$LABEL
# Empty .env file adding to buld during jenkins pipeline
# This is a default file for env
touch .env
docker build -t rnssolutions/trade4u-backend:$LABEL .
