import { GraphQLSchema } from 'graphql';
import Query from './queryType.js';
import Mutation from './mutationType.js';

const schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation,
});

export default schema;
