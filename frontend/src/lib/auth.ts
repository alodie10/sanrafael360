import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { ADMIN_EMAILS } from "@/lib/admin-emails";
import { exchangeGoogleAccessToken } from "@/lib/strapi-google-auth";
import { authenticateStrapiLocal } from "@/lib/strapi-local-auth";

export { ADMIN_EMAILS } from "@/lib/admin-emails";

function isPlaywrightTestMode(): boolean {
  return process.env.PLAYWRIGHT_TEST === '1' || process.env.NODE_ENV === 'test';
}

function resolveAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === '1') {
    return 'test-only-nextauth-secret-not-for-production';
  }

  // `next build` evalúa route handlers sin secrets de runtime (CI/local sin .env).
  if (
    process.env.CI === 'true' ||
    process.env.NEXT_PHASE === 'phase-production-build'
  ) {
    return 'build-time-placeholder-nextauth-secret';
  }

  // NEXTAUTH_SECRET no se expone al bundle del cliente (no es NEXT_PUBLIC_*).
  if (typeof window !== 'undefined') {
    return '';
  }

  throw new Error(
    'NEXTAUTH_SECRET es obligatorio. Agrégalo en frontend/.env.local (ver .env.example).'
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET 
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          authorization: {
            params: {
              prompt: "consent",
              access_type: "offline",
              response_type: "code",
              scope: "openid email profile"
            }
          }
        })] 
      : []),
    ...(isPlaywrightTestMode()
      ? [
          // FE-11: credentials solo para E2E. En prod el login público es Google.
          CredentialsProvider({
            id: 'credentials',
            name: 'Credentials',
            credentials: {
              email: { label: 'Email', type: 'email' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
              const email = credentials?.email?.trim();
              const password = credentials?.password;
              if (!email || !password) return null;

              try {
                const data = await authenticateStrapiLocal(email, password);
                const userEmail = data.user.email?.toLowerCase() ?? '';
                return {
                  id: data.user.id.toString(),
                  email: data.user.email,
                  jwt: data.jwt,
                  role: ADMIN_EMAILS.includes(userEmail) ? 'Admin' : 'Authenticated',
                };
              } catch {
                return null;
              }
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider === 'credentials' && user) {
        const authUser = user as { jwt?: string; role?: string };
        token.jwt = authUser.jwt ?? null;
        token.id = user.id;
        token.role = authUser.role ?? 'Authenticated';
        return token;
      }

      if (account?.provider === 'google' && account.access_token) {
        try {
          const data = await exchangeGoogleAccessToken(account.access_token);

          if (data.jwt) {
            token.jwt = data.jwt;
            token.id = data.user.id.toString();
            const isSovereignAdmin = ADMIN_EMAILS.includes(data.user.email?.toLowerCase() ?? '');
            token.role = isSovereignAdmin ? 'Admin' : 'Authenticated';
          }
        } catch (e: unknown) {
          token.jwt = null;
          token.id = null;
          token.error = e instanceof Error ? e.message : 'Error de autenticación con Strapi';
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.jwt = token.jwt ?? undefined;
      if (session.user) {
        session.user.id = token.id ?? undefined;
        session.user.role = token.role;
      }
      session.error = token.error;
      return session;
    }
  },
  pages: {
    signIn: '/login',
    newUser: '/registro'
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, 
  },
  secret: resolveAuthSecret(),
};
