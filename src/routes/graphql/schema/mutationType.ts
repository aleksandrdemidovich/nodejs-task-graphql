import { GraphQLObjectType } from 'graphql';
import { createUser, changeUser, deleteUser } from '../types/userTypes.js';
import { createProfile, changeProfile, deleteProfile } from '../types/profileTypes.js';
import { createPost, changePost, deletePost } from '../types/postTypes.js';

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createUser,
    changeUser,
    deleteUser,

    createProfile,
    changeProfile,
    deleteProfile,

    createPost,
    changePost,
    deletePost,

    //Figure out later
    // createMemberType:
    //updateMemberType:
    //deleteMemberType:
  },
});

export default Mutation;
