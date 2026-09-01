import "server-only";

import type {
  JapaneseLevel,
  LearningGoal,
  Prisma,
  User,
} from "@/generated/prisma/client";
import { prisma } from "@/server/db";

const userWithProfileSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  profile: {
    select: {
      displayName: true,
      japaneseLevel: true,
      learningGoal: true,
    },
  },
} as const;

export type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
  profile: {
    displayName: string;
    japaneseLevel: JapaneseLevel;
    learningGoal: LearningGoal;
  } | null;
};

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function findUserByEmailWithPassword(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
    },
  });
}

export async function findSafeUserById(id: string): Promise<SafeUser | null> {
  return prisma.user.findUnique({
    where: { id },
    select: userWithProfileSelect,
  });
}

export async function createUser(
  data: Prisma.UserCreateInput,
): Promise<User> {
  return prisma.user.create({ data });
}

type CreateProfileInput = {
  userId: string;
  displayName: string;
  japaneseLevel: JapaneseLevel;
  learningGoal: LearningGoal;
};

export async function createProfile(data: CreateProfileInput) {
  return prisma.profile.create({
    data: {
      userId: data.userId,
      displayName: data.displayName,
      japaneseLevel: data.japaneseLevel,
      learningGoal: data.learningGoal,
    },
  });
}

export async function createUserWithProfile(input: {
  email: string;
  passwordHash: string;
  displayName: string;
  japaneseLevel: JapaneseLevel;
  learningGoal: LearningGoal;
}) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        name: input.displayName,
        profile: {
          create: {
            displayName: input.displayName,
            japaneseLevel: input.japaneseLevel,
            learningGoal: input.learningGoal,
          },
        },
      },
      select: userWithProfileSelect,
    });

    return user;
  });
}
