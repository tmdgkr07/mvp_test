import fs from "node:fs";
import path from "node:path";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

function readEnvValue(filePath: string, key: string) {
  if (!fs.existsSync(filePath)) {
    return "";
  }

  const source = fs.readFileSync(filePath, "utf8");
  const pattern = new RegExp(`^${key}\\s*=\\s*(.+)$`, "m");
  const match = source.match(pattern);
  if (!match) {
    return "";
  }

  return match[1].trim().replace(/^['"]|['"]$/g, "");
}

function hydrateAuthRuntimeEnv() {
  if (
    (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET) &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  ) {
    return;
  }

  const candidates = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "../../.env.local"),
    path.join(process.cwd(), "../../.env")
  ];

  for (const filePath of candidates) {
    for (const key of ["AUTH_SECRET", "NEXTAUTH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]) {
      const value = readEnvValue(filePath, key);
      if (value && !process.env[key]) {
        process.env[key] = value;
      }
    }

    if (
      (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET) &&
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET
    ) {
      return;
    }
  }
}

hydrateAuthRuntimeEnv();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "database"
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ],
  callbacks: {
    session({ session, user }) {
      const dbRole = (user as { role?: string | null }).role;
      const normalizedRole =
        dbRole === "SUPER_ADMIN" || dbRole === "super_admin"
          ? "super_admin"
          : dbRole === "ADMIN" || dbRole === "admin"
            ? "admin"
            : "creator";

      return {
        user: session.user
          ? {
              name: session.user.name || user.name || null,
              email: session.user.email || user.email || null,
              image: session.user.image || user.image || null,
              id: user.id,
              isAdmin: normalizedRole === "admin" || normalizedRole === "super_admin",
              isSuperAdmin: normalizedRole === "super_admin",
              role: normalizedRole
            }
          : undefined,
        expires: session.expires
      };
    }
  },
  trustHost: true
});
