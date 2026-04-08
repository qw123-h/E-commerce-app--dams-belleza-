import {PrismaAdapter} from "@auth/prisma-adapter";
import type {DefaultSession, NextAuthOptions} from "next-auth";
import {getServerSession} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {resolveUserAccess} from "@/lib/rbac";

const ACCESS_REFRESH_TTL_SECONDS = 300;

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().trim().min(8),
});

async function authorizeWithCredentials(credentials: Record<string, string> | undefined) {
  const parsed = signInSchema.safeParse(credentials);

  if (!parsed.success) {
    return null;
  }

  const email = parsed.data.email;
  const user = await prisma.user.findUnique({
    where: {email},
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      passwordHash: true,
      status: true,
      deletedAt: true,
    },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  if (user.deletedAt || user.status !== "ACTIVE") {
    return null;
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
  };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24,
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: {label: "Email", type: "email"},
        password: {label: "Password", type: "password"},
      },
      authorize: authorizeWithCredentials,
    }),
  ],
  callbacks: {
    async jwt({token, user}) {
      if (user?.id) {
        token.sub = user.id;
      }

      if (!token.sub) {
        return token;
      }

      const now = Math.floor(Date.now() / 1000);
      const lastLoaded = typeof token.accessLoadedAt === "number" ? token.accessLoadedAt : 0;
      const hasCachedAccess = Array.isArray(token.roles) && Array.isArray(token.permissions);
      const shouldRefresh = !hasCachedAccess || now - lastLoaded > ACCESS_REFRESH_TTL_SECONDS || Boolean(user?.id);

      if (!shouldRefresh) {
        return token;
      }

      const activeUser = await prisma.user.findUnique({
        where: {id: token.sub},
        select: {
          id: true,
          status: true,
          deletedAt: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      if (!activeUser || activeUser.deletedAt || activeUser.status !== "ACTIVE") {
        token.roles = [];
        token.permissions = [];
        token.accessLoadedAt = now;
        return token;
      }

      const access = await resolveUserAccess(activeUser.id);

      token.email = activeUser.email;
      token.name = `${activeUser.firstName} ${activeUser.lastName}`;
      token.roles = access.roles;
      token.permissions = access.permissions;
      token.accessLoadedAt = now;

      return token;
    },
    async session({session, token}) {
      if (!session.user || !token.sub) {
        return session;
      }

      session.user.id = token.sub;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.roles = token.roles;
      session.user.permissions = token.permissions;

      return session;
    },
  },
};

export async function auth() {
  return getServerSession(authOptions);
}

export async function requireActiveSession() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {id: session.user.id},
    select: {id: true, status: true, deletedAt: true},
  });

  if (!user || user.deletedAt || user.status !== "ACTIVE") {
    return null;
  }

  return session as DefaultSession & {
    user: {
      id: string;
      roles?: string[];
      permissions?: string[];
    };
  };
}
