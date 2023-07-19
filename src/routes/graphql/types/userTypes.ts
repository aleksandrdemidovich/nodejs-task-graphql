import { FastifyInstance } from 'fastify';
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { UUIDType } from './uuid.js';
import { ProfileType, Profile } from './profileTypes.js';
import { PostType, Post } from './postTypes.js';

export interface UserType {
  id: string;
  name: string;
  balance: number;
  profile: ProfileType;
  posts: PostType[];
  userSubscribedTo: UserType[];
  subscribedToUser: UserType[];
}

interface CreateUser {
  dto: {
    name: string;
    balance: number;
  };
}

interface UpdateUser {
  id: string;
  dto: {
    name: string;
    balance: number;
  };
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

  static argsCreate: GraphQLInputObjectType = new GraphQLInputObjectType({
    name: 'CreateUserInput',
    fields: () => ({
      name: {
        type: new GraphQLNonNull(GraphQLString),
      },
      balance: {
        type: new GraphQLNonNull(GraphQLFloat),
      },
    }),
  });

  static argsUpdate: GraphQLInputObjectType = new GraphQLInputObjectType({
    name: 'ChangeUserInput',
    fields: () => ({
      name: {
        type: GraphQLString,
      },
      balance: {
        type: GraphQLFloat,
      },
    }),
  });

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
    usersFromProfile: async (parent: ProfileType, _args, fastify: FastifyInstance) => {
      const user = await fastify.prisma.user.findUnique({
        where: {
          id: parent.userId,
        },
      });
      return user;
    },
    usersFromPost: async (parent: PostType, _args, fastify: FastifyInstance) => {
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
    create: async (_parent, args: CreateUser, fastify: FastifyInstance) => {
      const newUser = await fastify.prisma.user.create({
        data: args.dto,
      });
      return newUser;
    },
    update: async (_parent, args: UpdateUser, fastify: FastifyInstance) => {
      return fastify.prisma.user.update({
        where: { id: args.id },
        data: args.dto,
      });
    },
    delete: async (_parent, args: { id: string }, fastify: FastifyInstance) => {
      await fastify.prisma.user.delete({
        where: {
          id: args.id,
        },
      });
      return null;
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

const createUser = {
  type: User.type,
  args: {
    dto: {
      type: new GraphQLNonNull(User.argsCreate),
    },
  },
  resolve: User.resolver.create,
};

const changeUser = {
  type: User.type,
  args: {
    id: {
      type: new GraphQLNonNull(UUIDType),
    },
    dto: {
      type: new GraphQLNonNull(User.argsUpdate),
    },
  },
  resolve: User.resolver.update,
};

const deleteUser = {
  type: GraphQLBoolean,
  args: {
    id: { type: UUIDType },
  },
  resolve: User.resolver.delete,
};

export { user, users, User, createUser, changeUser, deleteUser };
