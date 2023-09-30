curl localhost:4000/graphql -H "Content-Type: application/json" -XPOST   --data '{"query": "query { users { id cart { id name } } }"}' 
