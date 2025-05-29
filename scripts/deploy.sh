#!/bin/bash

NAME=$1
ENV=$2

if [ -z "$NAME" ] || [ -z "$ENV" ]; then
  echo "Usage: $0 <name> <environment>"
  exit 1
fi

IMAGE_NAME="$NAME-$ENV"
STACK_NAME="jsonexplorer"

ENV_FILE="$ENV.env"

echo "[+] Loading environment from $ENV env file"
export $(grep -v '^#' $ENV_FILE | xargs)

echo "[+] Pruning unused Docker resources..."
docker container prune -f
docker image prune -a -f

echo "[+] Pulling latest image..."
docker pull $NAME-$ENV:latest

echo "[+] Deploying stack: $STACK_NAME"
IMAGE_NAME="$IMAGE_NAME" docker stack deploy -c docker-compose-$ENV.yml $STACK_NAME
docker service update --force "${STACK_NAME}_app"

echo "[✓] Deployment triggered. Use 'docker service ls' to monitor status."
