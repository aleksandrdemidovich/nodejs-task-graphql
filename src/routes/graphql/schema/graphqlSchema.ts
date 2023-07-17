import { GraphQLSchema } from 'graphql';
import Query from './queryType.js';

const schema = new GraphQLSchema({
  query: Query,
});

export default schema;
