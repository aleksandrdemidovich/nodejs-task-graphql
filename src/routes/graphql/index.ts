import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, parse, validate } from 'graphql';
import schema from './schema/graphqlSchema.js';
import depthLimit from 'graphql-depth-limit';
import { dataLoadersHandler } from './dataLoader.js';
import userResolvers from './types/userTypes.js';
import profileResolvers from './types/profileTypes.js';
import postResolvers from './types/postTypes.js';
import memberResolvers from './types/memberType.js';

const rootValue = {
  ...userResolvers,
  ...userResolvers,
  ...memberResolvers,
  ...postResolvers,
  ...profileResolvers,
};

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;
  const dataLoaders = dataLoadersHandler(prisma);

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const validateResult = validate(schema, parse(req.body.query), [depthLimit(5)]);

      if (validateResult.length) {
        return { errors: validateResult };
      }
      return await graphql({
        schema,
        source: String(req.body.query),
        rootValue,
        contextValue: { prisma, ...dataLoaders },
        variableValues: req.body.variables,
      });
    },
  });
};

export default plugin;
