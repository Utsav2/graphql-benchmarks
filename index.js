const { ApolloServer, gql } = require("apollo-server");
const { ApolloServer: ApolloServerExpress } = require("apollo-server-express");
const async_hooks = require("node:async_hooks");
const express = require('express');
const { applyMiddleware } = require("graphql-middleware");
const { makeExecutableSchema } = require("graphql-tools");
const { AsyncLocalStorage } = require("node:async_hooks");

const Fastify = require("fastify");
const mercurius = require("mercurius");

const DataLoader = require("dataloader");

var chance = require("chance").Chance();

const hook = async_hooks.createHook({
  init: () => {},
  destroy: () => {},
});

const asyncLocalStorage = new AsyncLocalStorage();

const useMiddleware = process.env.USE_MIDDLEWARE === "1";
const useExpress = process.env.USE_EXPRESS === "1";
const useMercurius = process.env.USE_MERCURIUS === "1";
const useAsyncLocalStorage = process.env.USE_ASYNC_LOCAL_STORAGE === "1";

// The GraphQL schema
const schema = `
  type Item {
    id: String
    name: String
  }

  type SyncItem {
    id: String
    name: String
  }

  type User {
    id: String!
    cart: [Item!]!
    syncCart: [SyncItem!]!
  }

  type Query {
    syncUsers: [User!]!
    users: [User!]!
    dataLoadedUsers: [User!]!
  }

  type Mutation {
    setAsyncHooksEnabled(enabled: Boolean!): Boolean!
    setAsyncLocalStorageEnabled(enabled: Boolean!): Boolean!
    setUserLimit(limit: Int!): Int!
    setItemLimit(limit: Int!): Int!
  }
`;

const typeDefs = gql`
  ${schema}
`;

let userLimit = 2;
let itemLimit = 10;

const randomString = chance.string();

function getUsers(limit) {
  return Array(limit ?? userLimit).fill({
    id: randomString,
    cart: Array(itemLimit).fill({
      id: randomString,
    }),
    syncCart: Array(itemLimit).fill({
      id: randomString,
    }),
  });
}

async function getAsyncUsers(keys) {
  const l = keys?.length ?? userLimit;
  return getUsers(l);
}

const userLoader = new DataLoader(getAsyncUsers);

// A map of functions which return data for the schema.
const resolvers = {
  SyncItem: {
    name: () => randomString,
  },
  Item: {
    name: async () => Promise.resolve(randomString),
  },
  Query: {
    syncUsers: () => getUsers(),
    users: async () => Promise.resolve(getUsers()),
    dataLoadedUsers: async () => {
      const keys = Array(userLimit).fill(chance.string());
      const results = keys.map(async (key) => userLoader.load(key));
      return Promise.all(results);
    },
  },
  Mutation: {
    setAsyncHooksEnabled: (parent, args) => {
      if (args.enabled) {
        hook.enable();
      } else {
        hook.disable();
      }
      return args.enabled;
    },
    setAsyncLocalStorageEnabled: (parent, args) => {
      return false;
    },
    setUserLimit: (parent, args) => {
      userLimit = args.limit;
      return userLimit;
    },
    setItemLimit: (parent, args) => {
      itemLimit = args.limit;
      return itemLimit;
    },
  },
};

if (useExpress) {
  const app = express();

	if (useAsyncLocalStorage) {
  app.use((req, res, next) => {
    asyncLocalStorage.run({ ctx: "Ctx" }, () => {
      next();
    });
  });
	}

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
} else if (!useMercurius) {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
} else {
  const app = Fastify();
  app.register(mercurius, { schema, resolvers });
  app.listen({ port: 4000 });
}
