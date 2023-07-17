import { FastifyInstance } from 'fastify';
import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { UUIDType } from './uuid.js';
import { IUserType, User } from './userTypes.js';

export interface IPostType {
  id: string;
  title: string;
  content: string;
  author: IUserType;
  authorId: string;
}

class Post {
  static type: GraphQLObjectType = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
      id: {
        type: UUIDType,
      },
      title: {
        type: GraphQLString,
      },
      content: {
        type: GraphQLString,
      },
      authorId: {
        type: UUIDType,
      },
      author: {
        type: User.type,
        resolve: User.resolver.usersFromPost,
      },
    }),
  });

  static arrayType = new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post.type)));

  static resolver = {
    getOnce: async (
      _parent,
      args: { id: string },
      fastify: FastifyInstance,
    ) => {
      const post = await fastify.prisma.post.findUnique({
        where: {
          id: args.id,
        },
      });
      return post;
    },
    getAll: async (_parent, _args, fastify: FastifyInstance) => {
      return fastify.prisma.post.findMany();
    },
    postFromParent: async (
      parent: IUserType,
      _args,
      fastify: FastifyInstance,
    ) => {
      return fastify.prisma.post.findMany({
        where: {
          authorId: parent.id,
        },
      });
    },
  }
}

const post = {
  type: Post.type,
  args: { id: { type: UUIDType } },
  resolve: Post.resolver.getOnce,
};

const posts = {
  type: Post.arrayType,
  resolve: Post.resolver.getAll,
};

export { post, posts, Post };
