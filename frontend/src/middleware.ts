import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: "/login",
  }
});

// Definimos qué rutas requieren autenticación
export const config = {
  matcher: [
    "/portal/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};
