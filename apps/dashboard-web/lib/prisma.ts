import fs from "node:fs";
import path from "node:path";
import type { PrismaClient as PrismaClientType } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClientType | undefined;
}

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

function hydrateRuntimeDatabaseEnv() {
  if (process.env.DATABASE_URL_APP || process.env.DATABASE_URL) {
    return;
  }

  const candidates = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "../../.env.local"),
    path.join(process.cwd(), "../../.env")
  ];

  for (const filePath of candidates) {
    const databaseUrlApp = readEnvValue(filePath, "DATABASE_URL_APP");
    const directUrlApp = readEnvValue(filePath, "DIRECT_URL_APP");
    const databaseUrl = readEnvValue(filePath, "DATABASE_URL");
    const directUrl = readEnvValue(filePath, "DIRECT_URL");

    if (databaseUrlApp && !process.env.DATABASE_URL_APP) {
      process.env.DATABASE_URL_APP = databaseUrlApp;
    }
    if (directUrlApp && !process.env.DIRECT_URL_APP) {
      process.env.DIRECT_URL_APP = directUrlApp;
    }
    if (databaseUrl && !process.env.DATABASE_URL) {
      process.env.DATABASE_URL = databaseUrl;
    }
    if (directUrl && !process.env.DIRECT_URL) {
      process.env.DIRECT_URL = directUrl;
    }

    if (process.env.DATABASE_URL_APP || process.env.DATABASE_URL) {
      return;
    }
  }
}

hydrateRuntimeDatabaseEnv();

const runtimeDatabaseUrl = process.env.DATABASE_URL_APP || process.env.DATABASE_URL;

if (runtimeDatabaseUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = runtimeDatabaseUrl;
}

const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: typeof PrismaClientType;
};

const prismaOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
};

if (runtimeDatabaseUrl) {
  prismaOptions.datasources = {
    db: {
      url: runtimeDatabaseUrl
    }
  };
}

export const prisma: PrismaClientType =
  global.prisma || new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
