#!/bin/sh

# Default git commit number
GIT_COMMIT=unspecified
# Get current git commit number
LABEL=$(git log -1 --format=%h)
# Build docker of current directory
echo "Build docker image with label "$LABEL

docker build -t rnssolutions/binance_plus-backend:$LABEL .
