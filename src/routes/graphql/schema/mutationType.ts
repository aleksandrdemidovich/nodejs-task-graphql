import { GraphQLObjectType } from 'graphql';
import userResolvers from '../types/userTypes.js';
import profileResolvers from '../types/profileTypes.js';
import postResolvers from '../types/postTypes.js';

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    ...userResolvers,
    ...profileResolvers,
    ...postResolvers,
  },
});

export default Mutation;
