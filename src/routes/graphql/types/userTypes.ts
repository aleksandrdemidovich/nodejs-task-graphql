import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLString,
} from 'graphql';
import { UUIDType } from './uuid.js';
import { ProfileType, Profile } from './profileTypes.js';
import { PostType, Post } from './postTypes.js';
import { Void } from './Void.js';
import { DataRecord, IContext, ISubscription } from './dataLoaderTypes.js';
import {
  parseResolveInfo,
  ResolveTree,
  simplifyParsedResolveInfoFragmentWithType,
} from 'graphql-parse-resolve-info';

export interface UserType {
  id: string;
  name: string;
  balance: number;
  profile?: ProfileType;
  posts?: PostType[];
  userSubscribedTo?: ISubscription[];
  subscribedToUser?: ISubscription[];
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

interface UserSubscribedTo {
  userId: string;
  authorId: string;
}

export class User {
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
        resolve: async (
          source: UserType,
          _: DataRecord,
          { profileByUserIdLoader }: IContext,
        ) => profileByUserIdLoader.load(source.id),
      },
      posts: {
        type: new GraphQLList(Post.type),
        resolve: async (
          source: UserType,
          _: DataRecord,
          { postsByAuthorIdLoader }: IContext,
        ) => postsByAuthorIdLoader.load(source.id),
      },
      subscribedToUser: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User.type))),
        resolve: async (source: UserType, _: DataRecord, { userLoader }: IContext) =>
          source.subscribedToUser
            ? userLoader.loadMany(
                source.subscribedToUser.map(({ subscriberId }) => subscriberId),
              )
            : null,
      },
      userSubscribedTo: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User.type))),
        resolve: async (source: UserType, _: DataRecord, { userLoader }: IContext) =>
          source.userSubscribedTo
            ? userLoader.loadMany(source.userSubscribedTo.map(({ authorId }) => authorId))
            : null,
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
    getOnce: async (_parent, args: { id: string }, { userLoader }: IContext) => {
      const user = await userLoader.load(args.id);
      return user;
    },
    getAll: async (
      _source,
      _args,
      { prisma, userLoader }: IContext,
      resolveInfo: GraphQLResolveInfo,
    ) => {
      const parsedResolveInfoFragment = parseResolveInfo(resolveInfo);
      const { fields }: { fields: { [key in string]: ResolveTree } } =
        simplifyParsedResolveInfoFragmentWithType(
          parsedResolveInfoFragment as ResolveTree,
          new GraphQLList(User.type),
        );

      const users = await prisma.user.findMany({
        include: {
          userSubscribedTo: !!fields.userSubscribedTo,
          subscribedToUser: !!fields.subscribedToUser,
        },
      });

      users.forEach((user) => {
        userLoader.prime(user.id, user);
      });

      return users;
    },
    usersFromProfile: async (parent: ProfileType, _args, { prisma }: IContext) => {
      const user = await prisma.user.findUnique({
        where: {
          id: parent.userId,
        },
      });
      return user;
    },
    usersFromPost: async (parent: PostType, _args, { prisma }: IContext) => {
      const user = await prisma.user.findUnique({
        where: {
          id: parent.authorId,
        },
      });
      return user;
    },
    subscribedToUser: async (parent: { id: string }, _args, { prisma }: IContext) => {
      return prisma.user.findMany({
        where: {
          userSubscribedTo: {
            some: {
              authorId: parent.id,
            },
          },
        },
      });
    },
    userSubscribedTo: async (parent: { id: string }, _args, { prisma }: IContext) => {
      return prisma.user.findMany({
        where: {
          subscribedToUser: {
            some: {
              subscriberId: parent.id,
            },
          },
        },
      });
    },
    create: async (_parent, args: CreateUser, { prisma }: IContext) => {
      const newUser = await prisma.user.create({
        data: args.dto,
      });
      return newUser;
    },
    update: async (_parent, args: UpdateUser, { prisma }: IContext) => {
      const updatedUser = await prisma.user.update({
        where: { id: args.id },
        data: args.dto,
      });
      return updatedUser;
    },
    delete: async (_parent, args: { id: string }, { prisma }: IContext) => {
      await prisma.user.delete({
        where: {
          id: args.id,
        },
      });
      return null;
    },
    subscribeTo: async (_parent, args: UserSubscribedTo, { prisma }: IContext) => {
      return await prisma.user.update({
        where: {
          id: args.userId,
        },
        data: {
          userSubscribedTo: {
            create: {
              authorId: args.authorId,
            },
          },
        },
      });
    },
    unsubscribeFrom: async (_parent, args: UserSubscribedTo, { prisma }: IContext) => {
      await prisma.subscribersOnAuthors.delete({
        where: {
          subscriberId_authorId: {
            subscriberId: args.userId,
            authorId: args.authorId,
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

const subscribeTo = {
  type: User.type,
  args: {
    userId: {
      type: new GraphQLNonNull(UUIDType),
    },
    authorId: {
      type: new GraphQLNonNull(UUIDType),
    },
  },
  resolve: User.resolver.subscribeTo,
};

const unsubscribeFrom = {
  type: Void,
  args: {
    userId: {
      type: new GraphQLNonNull(UUIDType),
    },
    authorId: {
      type: new GraphQLNonNull(UUIDType),
    },
  },
  resolve: User.resolver.unsubscribeFrom,
};

export default {
  user,
  users,
  createUser,
  changeUser,
  deleteUser,
  subscribeTo,
  unsubscribeFrom,
};
