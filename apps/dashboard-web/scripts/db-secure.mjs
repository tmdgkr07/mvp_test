import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnv(path.join(repoRoot, ".env"));
loadEnv(path.join(repoRoot, ".env.local"));

const sqlFilePath = path.join(__dirname, "../prisma/secure-rls.sql");
const sql = fs.readFileSync(sqlFilePath, "utf8");

const prisma = new PrismaClient();

try {
  await prisma.$executeRawUnsafe(sql);
  console.log("Applied RLS hardening and privilege revocation.");
} finally {
  await prisma.$disconnect();
}
