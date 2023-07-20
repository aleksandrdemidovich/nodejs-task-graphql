import { GraphQLObjectType } from 'graphql';
import {
  createUser,
  changeUser,
  deleteUser,
  subscribeTo,
  unsubscribeFrom,
} from '../types/userTypes.js';
import { createProfile, changeProfile, deleteProfile } from '../types/profileTypes.js';
import { createPost, changePost, deletePost } from '../types/postTypes.js';

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createUser,
    changeUser,
    deleteUser,
    subscribeTo,
    unsubscribeFrom,

    createProfile,
    changeProfile,
    deleteProfile,

    createPost,
    changePost,
    deletePost,
  },
});

export default Mutation;
