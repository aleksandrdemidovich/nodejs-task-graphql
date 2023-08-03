import { GraphQLScalarType } from 'graphql';

export const Void = new GraphQLScalarType({
  name: 'Void',

  serialize() {
    return null;
  },

  parseValue() {
    return null;
  },

  parseLiteral() {
    return null;
  },
});