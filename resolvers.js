const DataLoader = require("dataloader");
const chance = require("chance").Chance();
const { makeExecutableSchema } = require("graphql-tools");
const async_hooks = require("node:async_hooks");

const hook = async_hooks.createHook({
  init: () => {},
  destroy: () => {},
});

let userLimit = 2;
let itemLimit = 10;

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
    setUserLimit(limit: Int!): Int!
    setItemLimit(limit: Int!): Int!
  }
`;

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

module.exports = { schema, resolvers };
