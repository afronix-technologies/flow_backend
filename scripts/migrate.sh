#!/bin/bash

# Usage:
# ./scripts/migrate.sh generate <name>
# ./scripts/migrate.sh run
# ./scripts/migrate.sh revert

CMD=$1
NAME=$2

if [ "$CMD" == "generate" ]; then
  if [ -z "$NAME" ]; then
    echo "Error: Migration name required."
    echo "Usage: ./scripts/migrate.sh generate <name>"
    exit 1
  fi
  npm run migration:create -- src/database/migrations/$NAME
elif [ "$CMD" == "run" ]; then
  npm run migration:run
elif [ "$CMD" == "revert" ]; then
  npm run migration:revert
else
  echo "Unknown command: $CMD"
  echo "Available commands: generate, run, revert"
  exit 1
fi
