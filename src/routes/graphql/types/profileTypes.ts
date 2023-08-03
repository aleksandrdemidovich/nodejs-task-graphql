import fastify, { FastifyInstance } from 'fastify';
import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql';
import { UUIDType } from './uuid.js';
import { memberTypeId } from './memberTypeId.js';
import { IMemberType, MemberType } from './memberType.js';
import { UserType } from './userTypes.js';
import { User } from './userTypes.js';
import { DataRecord, IContext } from './dataLoaderTypes.js';
import { MemberTypeId } from '../../member-types/schemas.js';

export interface ProfileType {
  id: string;
  isMale: boolean;
  yearOfBirth: number;
  userId: string;
  memberTypeId: string;
  user: UserType;
  memberType: IMemberType;
}

interface CreateProfile {
  dto: {
    isMale: boolean;
    yearOfBirth: number;
    memberTypeId: string;
    userId: string;
  };
}

interface UpdateProfile {
  id: string;
  dto: {
    isMale: boolean;
    yearOfBirth: number;
    memberTypeId: string;
  };
}

export class Profile {
  static type: GraphQLObjectType = new GraphQLObjectType({
    name: 'Profile',
    fields: () => ({
      id: {
        type: UUIDType,
      },
      isMale: {
        type: GraphQLBoolean,
      },
      yearOfBirth: {
        type: GraphQLInt,
      },
      userId: {
        type: UUIDType,
      },
      user: {
        type: User.type,
        resolve: async (source: ProfileType, _: DataRecord, { userLoader }: IContext) =>
          userLoader.load(source.userId),
      },
      memberTypeId: {
        type: memberTypeId,
      },
      memberType: {
        type: MemberType.type,
        resolve: async (
          source: ProfileType,
          _: DataRecord,
          { memberTypeLoader }: IContext,
        ) => memberTypeLoader.load(source.memberTypeId as MemberTypeId),
      },
    }),
  });

  static arrayType = new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(Profile.type)),
  );

  static argsCreate: GraphQLInputObjectType = new GraphQLInputObjectType({
    name: 'CreateProfileInput',
    fields: () => ({
      isMale: {
        type: new GraphQLNonNull(GraphQLBoolean),
      },
      yearOfBirth: {
        type: new GraphQLNonNull(GraphQLInt),
      },
      userId: {
        type: new GraphQLNonNull(UUIDType),
      },
      memberTypeId: {
        type: new GraphQLNonNull(memberTypeId),
      },
    }),
  });

  static argsUpdate: GraphQLInputObjectType = new GraphQLInputObjectType({
    name: 'ChangeProfileInput',
    fields: () => ({
      isMale: { type: GraphQLBoolean },
      yearOfBirth: { type: GraphQLInt },
      memberTypeId: { type: memberTypeId },
    }),
  });

  static resolver = {
    getOnce: async (_parent, args: { id: string }, { prisma }: IContext) => {
      const profile = await prisma.profile.findUnique({
        where: {
          id: args.id,
        },
      });
      return profile;
    },
    getAll: async (_parent, _args, { prisma }: IContext) => {
      return prisma.profile.findMany();
    },
    profileFromParent: async (parent: UserType, _args, { prisma }: IContext) => {
      const profile = await prisma.profile.findUnique({
        where: {
          userId: parent.id,
        },
      });
      return profile;
    },
    profileFromMemberType: async (parent: IMemberType, _args, { prisma }: IContext) => {
      return prisma.profile.findMany({
        where: {
          memberTypeId: parent.id,
        },
      });
    },
    create: async (_parent, args: CreateProfile, { prisma }: IContext) => {
      const newProfile = await prisma.profile.create({
        data: args.dto,
      });
      return newProfile;
    },
    update: async (_parent, args: UpdateProfile, { prisma }: IContext) => {
      const updatedProfile = await prisma.profile.update({
        where: { id: args.id },
        data: args.dto,
      });
      return updatedProfile;
    },
    delete: async (_parent, args: { id: string }, { prisma }: IContext) => {
      await prisma.profile.delete({
        where: {
          id: args.id,
        },
      });
    },
  };
}

const profile = {
  type: Profile.type,
  args: {
    id: {
      type: UUIDType,
    },
  },
  resolve: Profile.resolver.getOnce,
};

const profiles = {
  type: Profile.arrayType,
  resolve: Profile.resolver.getAll,
};

const createProfile = {
  type: Profile.type,
  args: {
    dto: {
      type: new GraphQLNonNull(Profile.argsCreate),
    },
  },
  resolve: Profile.resolver.create,
};

const changeProfile = {
  type: Profile.type,
  args: {
    id: {
      type: new GraphQLNonNull(UUIDType),
    },
    dto: {
      type: new GraphQLNonNull(Profile.argsUpdate),
    },
  },
  resolve: Profile.resolver.update,
};

const deleteProfile = {
  type: GraphQLBoolean,
  args: {
    id: { type: UUIDType },
  },
  resolve: Profile.resolver.delete,
};

export default { profile, profiles, createProfile, changeProfile, deleteProfile };
