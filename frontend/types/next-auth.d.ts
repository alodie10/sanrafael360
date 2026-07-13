import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    jwt?: string | null;
    error?: string;
    user: {
      id?: string;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    jwt?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    jwt?: string | null;
    id?: string | null;
    role?: string;
    error?: string;
  }
}
