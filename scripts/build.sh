#!/bin/bash

NAME=$1
ENV=$2

if [ -z "$NAME" ] || [ -z "$ENV" ]; then
  echo "Usage: $0 <name> <environment>"
  exit 1
fi

echo "Building Docker image for $NAME-$ENV"

docker build --build-arg ENV=$ENV -t $NAME-$ENV:latest .
