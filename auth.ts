import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { store: true },
        });
        if (!user) return null;
        const valid = await compare(credentials.password as string, user.password);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
          storeId: user.store?.id ?? null,
          storeName: user.store?.name ?? null,
          instanceName: user.store?.evolutionInstanceName ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
        token.storeId = (user as { storeId?: string | null }).storeId ?? null;
        token.storeName = (user as { storeName?: string | null }).storeName ?? null;
        token.instanceName = (user as { instanceName?: string | null }).instanceName ?? null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.isAdmin = token.isAdmin as boolean;
      session.user.storeId = token.storeId as string | null;
      session.user.storeName = token.storeName as string | null;
      session.user.instanceName = token.instanceName as string | null;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});
