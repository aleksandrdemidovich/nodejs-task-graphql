import { FastifyInstance } from 'fastify';
import {
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql';
import { memberTypeId } from './memberTypeId.js';
import { ProfileType, Profile } from './profileTypes.js';
import { DataRecord, IContext } from './dataLoaderTypes.js';

export interface IMemberType {
  id: string;
  discount: number;
  postsLimitPerMonth: number;
  profiles: ProfileType[];
}

export class MemberType {
  static type: GraphQLObjectType = new GraphQLObjectType({
    name: 'MemberType',
    fields: () => ({
      id: {
        type: memberTypeId,
      },
      discount: {
        type: GraphQLFloat,
      },
      postsLimitPerMonth: {
        type: GraphQLInt,
      },
      profiles: {
        type: new GraphQLList(Profile.type),
        resolve: async (
          source: IMemberType,
          _: DataRecord,
          { profilesByMemberTypeIdLoader }: IContext,
        ) => profilesByMemberTypeIdLoader.load(source.id),
      },
    }),
  });

  static arrayType = new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(MemberType.type)),
  );

  static resolver = {
    getOnce: async (_parent, args: { id: string }, { prisma }: IContext) => {
      const memberType = await prisma.memberType.findUnique({
        where: {
          id: args.id,
        },
      });
      return memberType;
    },
    getAll: async (_parent, _args, { prisma }: IContext) => {
      return prisma.memberType.findMany();
    },
    memberTypeFromProfile: async (
      parent: ProfileType,
      _args,
      fastify: FastifyInstance,
    ) => {
      const memberType = await fastify.prisma.memberType.findUnique({
        where: {
          id: parent.memberTypeId,
        },
      });
      return memberType;
    },
  };
}

const memberType = {
  type: MemberType.type,
  args: { id: { type: memberTypeId } },
  resolve: MemberType.resolver.getOnce,
};

const memberTypes = {
  type: MemberType.arrayType,
  resolve: MemberType.resolver.getAll,
};

export default { memberType, memberTypes };
