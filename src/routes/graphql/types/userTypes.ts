import { FastifyInstance } from 'fastify';
import {
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { UUIDType } from './uuid.js';
import { IProfileType, Profile } from './profileTypes.js';
import { IPostType, Post } from './postTypes.js';

export interface IUserType {
  id: string;
  name: string;
  balance: number;
  profile: IProfileType;
  posts: IPostType[];
  userSubscribedTo: IUserType[];
  subscribedToUser: IUserType[];
}

class User {
  static type: GraphQLObjectType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
      id: {
        type: UUIDType,
      },
      name: {
        type: GraphQLString,
      },
      balance: {
        type: GraphQLFloat,
      },
      profile: {
        type: Profile.type,
        resolve: Profile.resolver.profileFromParent,
      },
      posts: {
        type: new GraphQLList(Post.type),
        resolve: Post.resolver.postFromParent,
      },
      subscribedToUser: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User.type))),
        resolve: User.resolver.subscribedToUser,
      },
      userSubscribedTo: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User.type))),
        resolve: User.resolver.userSubscribedTo,
      },
    }),
  });

  static arrayType = new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User.type)));

  static resolver = {
    getOnce: async (_parent, args: { id: string }, fastify: FastifyInstance) => {
      const user = await fastify.prisma.user.findUnique({
        where: {
          id: args.id,
        },
      });
      return user;
    },
    getAll: async (_parent, _args, fastify: FastifyInstance) => {
      return fastify.prisma.user.findMany();
    },
    usersFromProfile: async (parent: IProfileType, _args, fastify: FastifyInstance) => {
      const user = await fastify.prisma.user.findUnique({
        where: {
          id: parent.userId,
        },
      });
      return user;
    },
    usersFromPost: async (parent: IPostType, _args, fastify: FastifyInstance) => {
      const user = await fastify.prisma.user.findUnique({
        where: {
          id: parent.authorId,
        },
      });
      return user;
    },
    subscribedToUser: async (parent: { id: string }, _args, fastify: FastifyInstance) => {
      return fastify.prisma.user.findMany({
        where: {
          userSubscribedTo: {
            some: {
              authorId: parent.id,
            },
          },
        },
      });
    },
    userSubscribedTo: async (parent: { id: string }, _args, fastify: FastifyInstance) => {
      return fastify.prisma.user.findMany({
        where: {
          subscribedToUser: {
            some: {
              subscriberId: parent.id,
            },
          },
        },
      });
    },
  };
}

const user = {
  type: User.type,
  args: { id: { type: UUIDType } },
  resolve: User.resolver.getOnce,
};

const users = {
  type: User.arrayType,
  resolve: User.resolver.getAll,
};

export { user, users, User };
