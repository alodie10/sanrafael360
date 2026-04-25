import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET 
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
          const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
          if (strapiUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
            console.warn("⚠️ WARNING: Connectando a LOCALHOST en entorno de PRODUCCIÓN.");
          }

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
          
          if (!res.ok) {
            console.error(`❌ Strapi Auth Error: ${res.status} ${res.statusText}`);
            return null;
          }

          const data = await res.json();
          if (res.ok && data.user) {
            // Regla de Oro: Si el email es el del dueño, forzamos rol de Admin
            const isSovereignAdmin = data.user.email === 'diegocristianalonso@gmail.com';
            
            // Fetch extra user data including role with a timeout fallback
            let userRole = isSovereignAdmin ? 'Admin' : 'Authenticated';
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
              }
            } catch (roleErr) {
              // Silent fail
            }
            
            // Aseguramos que el email soberano prevalezca SIEMPRE sobre la DB
            if (isSovereignAdmin) {
              userRole = 'Admin';
            }
            
            return {
              id: data.user.id.toString(),
              name: data.user.username,
              email: data.user.email,
              role: userRole,
              jwt: data.jwt // Store Strapi JWT
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
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      if (account?.provider === 'google') {
        try {
          console.log(`[AUTH] Attempting Strapi Handshake with provider: google`);
          console.log(`[AUTH] Access Token length: ${account.access_token?.length || 0}`);
          
          const res = await fetch(`${strapiUrl}/api/auth/google/callback?access_token=${account.access_token}`);
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error(`❌ STRAPI AUTH REJECTED [${res.status}]: ${res.statusText}`);
            console.error(`Payload received from Strapi:`, errorText);
            
            // Intento alternativo con id_token si el access_token falló
            if (account.id_token) {
              console.log(`[AUTH] Retrying with id_token...`);
              const resId = await fetch(`${strapiUrl}/api/auth/google/callback?id_token=${account.id_token}`);
              if (resId.ok) {
                const dataId = await resId.json();
                console.log(`✅ Success with id_token!`);
                token.jwt = dataId.jwt;
                token.id = dataId.user.id.toString();
                // ... el resto de la lógica de roles vendría aquí, pero priorizamos el JWT
              }
              }
            }
            
            // Si llegamos aquí y no hay token, guardamos el error para mostrarlo
            token.error = `Strapi rechazó el login [${res.status}]. Asegurate de que el proveedor Google esté activo en Strapi Admin.`;
          }
          
          const data = await res.json();
          if (data.jwt) {
            token.jwt = data.jwt;
            token.id = data.user.id.toString();

            // Identificar si es el dueño
            const isSovereignAdmin = data.user.email === 'diegocristianalonso@gmail.com';
            let userRole = isSovereignAdmin ? 'Admin' : 'Authenticated';
            
            // Obtener rol
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);
              const userRes = await fetch(`${strapiUrl}/api/users/me?populate=role`, {
                headers: { "Authorization": `Bearer ${data.jwt}` },
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              
              if (userRes.ok) {
                const userData = await userRes.json();
                userRole = userData.role?.name || 'Authenticated';
              }
            } catch (roleErr) {
              // Silent fail
            }
            
            if (isSovereignAdmin) userRole = 'Admin';
            token.role = userRole;
          } else {
            token.error = "Strapi no devolvió un JWT. Verificá la configuración del plugin users-permissions.";
          }
        } catch (e: any) {
          console.error("🚨 Google Handshake Exception:", e.message || e);
          token.error = `Error de red con Strapi: ${e.message}`;
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "default_development_secret_only",
};
