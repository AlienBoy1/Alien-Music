import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

const providers = [
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
  ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
    ? [
        GitHub({
          clientId: process.env.AUTH_GITHUB_ID,
          clientSecret: process.env.AUTH_GITHUB_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
  Credentials({
    name: "credentials",
    credentials: {
      identifier: { label: "Email o @username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const identifier = (credentials?.identifier as string | undefined)?.trim();
      const password = credentials?.password as string | undefined;

      if (!identifier || !password) return null;

      const supabase = createAdminClient();
      const normalized = identifier.toLowerCase();
      const isEmail = normalized.includes("@");

      let query = supabase
        .from("users")
        .select("id, name, email, image, password_hash, username");

      if (isEmail) {
        query = query.eq("email", normalized);
      } else {
        const username = normalized.replace(/^@/, "");
        query = query.ilike("username", username);
      }

      const { data: user, error } = await query.maybeSingle();

      if (error || !user?.password_hash) return null;

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter:
    process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY
      ? SupabaseAdapter({
          url: process.env.SUPABASE_URL,
          secret: process.env.SUPABASE_SECRET_KEY,
        })
      : undefined,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    newUser: "/your-library",
  },
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  trustHost: true,
});
