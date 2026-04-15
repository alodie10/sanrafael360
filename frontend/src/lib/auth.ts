import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        try {
          const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
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
          
          const data = await res.json();
          if (res.ok && data.user) {
            // Fetch extra user data including role
            const userRes = await fetch(`${strapiUrl}/api/users/me?populate=role`, {
              headers: {
                "Authorization": `Bearer ${data.jwt}`
              }
            });
            const userData = await userRes.json();
            
            return {
              id: data.user.id.toString(),
              name: data.user.username,
              email: data.user.email,
              role: userData.role?.name || 'Authenticated',
              jwt: data.jwt // Store Strapi JWT
            };
          }
          return null;
        } catch (e) {
          console.error("Auth Error:", e);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
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
      return session;
    }
  },
  pages: {
    signIn: '/login',
    newUser: '/registro'
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "default_development_secret_only",
};
