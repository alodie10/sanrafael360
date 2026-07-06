import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { ADMIN_EMAILS } from "@/lib/admin-emails";
import { exchangeGoogleAccessToken } from "@/lib/strapi-google-auth";

export { ADMIN_EMAILS } from "@/lib/admin-emails";

function resolveAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === '1') {
    return 'test-only-nextauth-secret-not-for-production';
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
  ],
  callbacks: {
    async jwt({ token, account }) {
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
      (session as any).jwt = token.jwt as string;
      (session as any).user.id = token.id as string;
      (session as any).user.role = token.role as string;
      (session as any).error = token.error as string;
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
