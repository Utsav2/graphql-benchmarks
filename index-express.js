const { ApolloServer: ApolloServerExpress } = require("apollo-server-express");
const express = require("express");
const { applyMiddleware } = require("graphql-middleware");
const { schema, resolvers } = require("./resolvers.js");
const { gql } = require("apollo-server");
const { AsyncLocalStorage } = require("node:async_hooks");

const useAsyncLocalStorage = process.env.USE_ASYNC_LOCAL_STORAGE === "1";

const asyncLocalStorage = new AsyncLocalStorage();
const app = express();

if (useAsyncLocalStorage) {
  app.use((req, res, next) => {
    asyncLocalStorage.run({ ctx: "Ctx" }, () => {
      next();
    });
  });
}

const typeDefs = gql`
  ${schema}
`;

const server = new ApolloServerExpress({
  typeDefs,
  resolvers,
});

server.start().then(() => {
  server.applyMiddleware({ app });

  app.listen({ port: 4000 }, () =>
    console.log(`Server ready at http://localhost:4000${server.graphqlPath}`),
  );
});
