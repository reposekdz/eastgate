import NextAuth, { DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      mustChangePassword: boolean;
      branchId: string | null;
      branch?: {
        id: string;
        name: string;
      };
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    mustChangePassword: boolean;
    branchId: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (!user || user.status !== "ACTIVE") {
          throw new Error("Invalid credentials or inactive account");
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          branchId: user.branchId,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
        token.branchId = user.branchId;
      }

      // Fetch latest user data
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.mustChangePassword = dbUser.mustChangePassword;
          token.branchId = dbUser.branchId;
          token.branch = dbUser.branch;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
        session.user.branchId = token.branchId as string | null;
        session.user.branch = token.branch as any;
      }

      return session;
    },
  },
});
