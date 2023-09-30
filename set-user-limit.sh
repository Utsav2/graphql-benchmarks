#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <limit>"
    exit 1
fi

limit=$1

curl localhost:4000/graphql -H "Content-Type: application/json" -XPOST \
--data "{\"query\": \"mutation m { setUserLimit(limit: $limit) }\"}"
