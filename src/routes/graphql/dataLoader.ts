import { MemberType, PrismaClient, Profile } from '@prisma/client';
import DataLoader from 'dataloader';
import { MemberTypeId } from '../member-types/schemas.js';
import { PostType } from './types/postTypes.js';
import { UserType } from './types/userTypes.js';

export interface IDataLoaders {
  userLoader: DataLoader<string, UserType>;
  postsByAuthorIdLoader: DataLoader<string, PostType[]>;
  profileByUserIdLoader: DataLoader<string, Profile>;
  memberTypeLoader: DataLoader<MemberTypeId, MemberType>;
  profilesByMemberTypeIdLoader: DataLoader<string, Profile[]>;
}

export const dataLoadersHandler = (prisma: PrismaClient): IDataLoaders => {
  const getUserByIdBatch = async (ids: readonly string[]) => {
    const users = await prisma.user.findMany({
      where: { id: { in: ids as string[] } },
      include: {
        userSubscribedTo: true,
        subscribedToUser: true,
      },
    });

    const userMap = users.reduce(
      (acc, user) => {
        acc[user.id] = user;
        return acc;
      },
      {} as Record<string, UserType>,
    );

    return ids.map((id) => userMap[id]);
  };

  const getProfileByUserIdBatch = async (ids: readonly string[]) => {
    const profiles = await prisma.profile.findMany({
      where: { userId: { in: ids as string[] } },
    });

    const profileMap = profiles.reduce(
      (acc, profile) => {
        acc[profile.userId] = profile;
        return acc;
      },
      {} as Record<string, Profile>,
    );

    return ids.map((id) => profileMap[id]);
  };

  const getPostsByAuthorIdBatch = async (ids: readonly string[]) => {
    const posts = await prisma.post.findMany({
      where: { authorId: { in: ids as string[] } },
    });
    const postMap = posts.reduce(
      (acc, post) => {
        acc[post.authorId]
          ? acc[post.authorId].push(post)
          : (acc[post.authorId] = [post]);
        return acc;
      },
      {} as Record<string, PostType[]>,
    );

    return ids.map((id) => postMap[id]);
  };

  const getMemberTypeBatch = async (ids: readonly MemberTypeId[]) => {
    const memberTypes = await prisma.memberType.findMany({
      where: { id: { in: ids as MemberTypeId[] } },
    });
    const memberTypeMap = memberTypes.reduce(
      (acc, memberType) => {
        acc[memberType.id] = memberType;
        return acc;
      },
      {} as Record<MemberTypeId, MemberType>,
    );

    return ids.map((id) => memberTypeMap[id]);
  };

  const getProfilesByMemberTypeIdBatch = async (ids: readonly MemberTypeId[]) => {
    const profiles = await prisma.profile.findMany({
      where: { memberTypeId: { in: ids as MemberTypeId[] } },
    });

    const profileMap = profiles.reduce(
      (acc, profile) => {
        acc[profile.memberTypeId]
          ? acc[profile.memberTypeId].push(profile)
          : (acc[profile.memberTypeId] = [profile]);
        return acc;
      },
      {} as Record<string, Profile[]>,
    );

    return ids.map((id) => profileMap[id]);
  };

  return {
    userLoader: new DataLoader(getUserByIdBatch),
    profileByUserIdLoader: new DataLoader(getProfileByUserIdBatch),
    postsByAuthorIdLoader: new DataLoader(getPostsByAuthorIdBatch),
    memberTypeLoader: new DataLoader(getMemberTypeBatch),
    profilesByMemberTypeIdLoader: new DataLoader(getProfilesByMemberTypeIdBatch),
  };
};
