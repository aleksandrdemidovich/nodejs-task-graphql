import { FastifyInstance } from 'fastify';
import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { UUIDType } from './uuid.js';
import { UserType } from './userTypes.js';
import { User } from './userTypes.js';
import { DataRecord, IContext } from './dataLoaderTypes.js';

export interface PostType {
  id: string;
  title: string;
  content: string;
  author?: UserType;
  authorId: string;
}

interface CreatePost {
  dto: {
    title: string;
    content: string;
    authorId: string;
  };
}

interface UpdatePost {
  id: string;
  dto: {
    title: string;
    content: string;
  };
}

export class Post {
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
        resolve: async (source: PostType, _: DataRecord, { userLoader }: IContext) =>
          userLoader.load(source.authorId),
      },
    }),
  });

  static arrayType = new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post.type)));

  static argsCreate = new GraphQLInputObjectType({
    name: 'CreatePostInput',
    fields: () => ({
      title: {
        type: new GraphQLNonNull(GraphQLString),
      },
      content: {
        type: new GraphQLNonNull(GraphQLString),
      },
      authorId: {
        type: new GraphQLNonNull(UUIDType),
      },
    }),
  });

  static argsUpdate = new GraphQLInputObjectType({
    name: 'ChangePostInput',
    fields: () => ({
      title: { type: GraphQLString },
      content: { type: GraphQLString },
      authorId: { type: UUIDType },
    }),
  });

  static resolver = {
    getOnce: async (_parent, args: { id: string }, { prisma }: IContext) => {
      const post = await prisma.post.findUnique({
        where: {
          id: args.id,
        },
      });
      return post;
    },
    getAll: async (_parent, _args, { prisma }: IContext) => {
      return prisma.post.findMany();
    },
    postFromParent: async (parent: UserType, _args, { prisma }: IContext) => {
      return prisma.post.findMany({
        where: {
          authorId: parent.id,
        },
      });
    },
    create: async (_parent, args: CreatePost, { prisma }: IContext) => {
      const newPost = await prisma.post.create({
        data: args.dto,
      });
      return newPost;
    },
    update: async (_parent, args: UpdatePost, { prisma }: IContext) => {
      const updatedPost = await prisma.post.update({
        where: { id: args.id },
        data: args.dto,
      });
      return updatedPost;
    },
    delete: async (_parent, args: { id: string }, { prisma }: IContext) => {
      await prisma.post.delete({
        where: {
          id: args.id,
        },
      });
    },
  };
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

const createPost = {
  type: Post.type,
  args: {
    dto: {
      type: new GraphQLNonNull(Post.argsCreate),
    },
  },
  resolve: Post.resolver.create,
};

const changePost = {
  type: Post.type,
  args: {
    id: { type: new GraphQLNonNull(UUIDType) },
    dto: { type: new GraphQLNonNull(Post.argsUpdate) },
  },
  resolve: Post.resolver.update,
};

const deletePost = {
  type: GraphQLBoolean,
  args: {
    id: { type: UUIDType },
  },
  resolve: Post.resolver.delete,
};

export default { post, posts, createPost, changePost, deletePost };
