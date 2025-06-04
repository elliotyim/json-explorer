#!/bin/bash

if [ $# -ne 1 ]; then
  echo "Usage: $0 <environment>"
  exit 1
fi

ENV=$1

ENV_FILE="$ENV.env"

echo "[+] Loading environment from $ENV env file"
set -a
source "$ENV_FILE"
set +a

curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUD_ZONE_ID}/purge_cache" \
     -H "Authorization: Bearer ${CLOUD_API_TOKEN}" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
