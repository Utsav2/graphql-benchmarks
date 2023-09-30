autocannon -c 1 -p 1 'http://localhost:4000/graphql' -m 'POST' --headers 'Content-Type: application/json' --body '{"query": "query { users { id cart { id name } } }"}'
