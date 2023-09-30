const Fastify = require("fastify");
const mercurius = require("mercurius");
const { schema, resolvers } = require("./resolvers.js");

const app = Fastify();
app.register(mercurius, { schema, resolvers });
app.listen({ port: 4000 });
