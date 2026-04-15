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
        console.log(`🔑 [AUTH] Secret configured: ${process.env.NEXTAUTH_SECRET ? 'YES' : 'NO'}`);
        if (!credentials?.identifier || !credentials?.password) return null;

        try {
          const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
          console.log(`📡 [AUTH] Attempting login for: ${credentials.identifier} at ${strapiUrl}`);
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
            console.log(`✅ [AUTH] Login successful for: ${data.user.email}`);
            // Fetch extra user data including role with a timeout fallback
            let userRole = 'Authenticated';
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

              const userRes = await fetch(`${strapiUrl}/api/users/me?populate=role`, {
                headers: {
                  "Authorization": `Bearer ${data.jwt}`
                },
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);

              if (userRes.ok) {
                const userData = await userRes.json();
                userRole = userData.role?.name || 'Authenticated';
                console.log(`🎭 [AUTH] User role: ${userRole}`);
              } else {
                console.warn(`⚠️ [AUTH] Failed to fetch role (Status ${userRes.status}), using default Authenticated`);
              }
            } catch (roleErr) {
              console.warn("⚠️ [AUTH] Failed to fetch role, defaulting to Authenticated:", roleErr);
            }
            
            return {
              id: data.user.id.toString(),
              name: data.user.username,
              email: data.user.email,
              role: userRole,
              jwt: data.jwt // Store Strapi JWT
            };
          }
          console.error(`❌ [AUTH] Login failed for ${credentials.identifier}:`, data.error?.message || "Invalid credentials");
          return null;
        } catch (e: any) {
          console.error("Auth Error:", e.name === 'AbortError' ? 'Timeout' : e.message);
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "default_development_secret_only",
  trustHost: true,
};
