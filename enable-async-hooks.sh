curl localhost:4000/graphql -H "Content-Type: application/json" -XPOST   --data '{"query": "mutation m { setAsyncHooksEnabled(enabled: true) }"}' 