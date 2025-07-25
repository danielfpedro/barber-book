import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { tenant: true },
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!passwordMatch) {
          return null;
        }

        return { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId, tenantSlug: user.tenant.slug, type: 'user' };
      },
    }),
    CredentialsProvider({
      id: 'enduser-credentials',
      name: 'End-User Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const endUser = await prisma.endUser.findUnique({
          where: { email: credentials.email },
        });

        if (!endUser) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password, endUser.passwordHash);

        if (!passwordMatch) {
          return null;
        }

        return { id: endUser.id, email: endUser.email, type: 'endUser' };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email; // Ensure email is also in token
        token.type = user.type; // Add type to token
        if (user.type === 'user') {
          token.role = user.role;
          token.tenantId = user.tenantId;
          token.tenantSlug = user.tenantSlug;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email; // Ensure email is also in session
      session.user.type = token.type; // Add type to session
      if (token.type === 'user') {
        session.user.role = token.role;
        session.user.tenantId = token.tenantId;
        session.user.tenantSlug = token.tenantSlug;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };