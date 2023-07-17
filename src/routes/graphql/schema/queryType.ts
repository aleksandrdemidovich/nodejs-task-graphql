import { GraphQLObjectType } from 'graphql';
import { memberType, memberTypes } from '../types/memberType.js';
import { post, posts } from '../types/postTypes.js';
import { profile, profiles } from '../types/profileTypes.js';
import { user, users } from '../types/userTypes.js';

const Query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    user,
    users,
    post,
    posts,
    profile,
    profiles,
    memberType,
    memberTypes,
  },
});

export default Query;
