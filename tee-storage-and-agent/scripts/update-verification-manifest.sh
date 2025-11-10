#!/bin/bash

set -euo pipefail

SCRIPT_PATH=$(dirname $(realpath $0))
ROOT_PATH="$SCRIPT_PATH/../"
COMPOSE_FILE="$ROOT_PATH/docker-compose.nilcc.yml"
VERIFICATION_FILE="$ROOT_PATH/verification-manifest.json"

if command -v sha256sum >/dev/null 2>&1; then
  DOCKER_COMPOSE_HASH=$(sha256sum "$COMPOSE_FILE" | awk '{print $1}')
elif command -v shasum >/dev/null 2>&1; then
  DOCKER_COMPOSE_HASH=$(shasum -a 256 "$COMPOSE_FILE" | awk '{print $1}')
else
  echo "Error: neither sha256sum nor shasum is available" >&2
  exit 1
fi

VCPUS=1
NILCC_VERSION=0.2.1

MEASUREMENT_HASH=$(docker run -v/tmp/nilcc-verifier-cache:/tmp/nilcc-verifier-cache --rm ghcr.io/nillionnetwork/nilcc-verifier:latest measurement-hash $DOCKER_COMPOSE_HASH $NILCC_VERSION --vm-type cpu --cpus $VCPUS)
MEASUREMENT_HASH=$(echo "$MEASUREMENT_HASH" | tr -d '\r\n')

node <<'NODE' "$VERIFICATION_FILE" "$NILCC_VERSION" "$MEASUREMENT_HASH" "$DOCKER_COMPOSE_HASH" "$VCPUS"
const fs = require('fs');
const [file, version, measurement, composeHash, cpus] = process.argv.slice(1);
const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
data[version] = {
  measurement_hash: measurement,
  docker_compose_hash: composeHash,
  cpus: Number(cpus),
  nilcc_version: version,
};
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
NODE

echo "$MEASUREMENT_HASH"
