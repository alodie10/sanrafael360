import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const ADMIN_EMAILS = ['diegocristianalonso@gmail.com', 'mlauralodi@gmail.com'];

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
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        try {
          const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://sanrafael360-production.up.railway.app";
          const res = await fetch(`${strapiUrl}/api/auth/local`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              identifier: credentials.identifier,
              password: credentials.password,
            }),
          });
          
          if (!res.ok) return null;

          const data = await res.json();
          if (res.ok && data.user) {
            const isSovereignAdmin = ADMIN_EMAILS.includes(data.user.email);
            return {
              id: data.user.id.toString(),
              name: data.user.username,
              email: data.user.email,
              role: isSovereignAdmin ? 'Admin' : 'Authenticated',
              jwt: data.jwt 
            };
          }
          return null;
        } catch (e: any) {
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://sanrafael360-production.up.railway.app";
      
      if (account?.provider === 'google') {
        try {
          const res = await fetch(`${strapiUrl}/api/auth/google/callback?access_token=${account.access_token}`);
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            token.jwt = null;
            token.id = null;
            token.error = `Strapi Error ${res.status}: ${errorData.error?.message || 'Handshake fallido'}`;
          } else {
            const data = await res.json();
            if (data.jwt) {
              token.jwt = data.jwt;
              token.id = data.user.id.toString();
              const isSovereignAdmin = ADMIN_EMAILS.includes(data.user.email);
              token.role = isSovereignAdmin ? 'Admin' : 'Authenticated';
            }
          }
        } catch (e: any) {
          token.error = `Error de red: ${e.message}`;
        }
      } else if (user) {
        token.jwt = (user as any).jwt;
        token.id = user.id;
        token.role = (user as any).role;
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
  secret: process.env.NEXTAUTH_SECRET || "default_development_secret_only",
};
