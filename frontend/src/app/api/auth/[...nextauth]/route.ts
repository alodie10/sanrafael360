import NextAuth, { NextAuthOptions } from "next-auth";
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
          // You may want to construct this dynamically using process.env.NEXT_PUBLIC_STRAPI_URL
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
            return {
              id: data.user.id.toString(),
              name: data.user.username,
              email: data.user.email,
              jwt: data.jwt // Store Strapi JWT
            };
          }
          return null;
        } catch (e) {
          console.error(e);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add jwt and id to token right after sign in
      if (user) {
        token.jwt = user.jwt;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add jwt and id to session so it's accessible in the client
      session.jwt = token.jwt as string;
      session.user.id = token.id as string;
      return session;
    }
  },
  pages: {
    signIn: '/login', // Custom login page
    newUser: '/registro'
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "default_development_secret_only",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
