import { GraphQLObjectType } from 'graphql';
import MemberQuery from '../types/memberType.js';
import PostQuery from '../types/postTypes.js';
import UserQuery from '../types/userTypes.js';
import ProfileQuery from '../types/profileTypes.js';

const Query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    user: UserQuery.user,
    users: UserQuery.users,
    post: PostQuery.post,
    posts: PostQuery.posts,
    profile: ProfileQuery.profile,
    profiles: ProfileQuery.profiles,
    memberType: MemberQuery.memberType,
    memberTypes: MemberQuery.memberTypes,
  },
});

export default Query;
