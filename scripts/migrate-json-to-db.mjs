import { promises as fs } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(value) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "project";
}

async function uniqueSlug(name) {
  const base = slugify(name);
  let slug = base;
  let index = 2;

  while (true) {
    const exists = await prisma.project.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${base}-${index}`;
    index += 1;
  }
}

async function run() {
  const filePath = path.join(process.cwd(), "data", "mvp-data.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const json = JSON.parse(raw);

  const projectMap = new Map();
  let insertedProjects = 0;
  let insertedEvents = 0;
  let insertedFeedback = 0;

  for (const project of json.projects || []) {
    const slug = await uniqueSlug(project.name || "project");
    const created = await prisma.project.create({
      data: {
        id: project.id,
        ownerId: null,
        slug,
        name: project.name || "Untitled",
        tagline: project.tagline || "아직 소개 문구가 없습니다.",
        websiteUrl: project.websiteUrl || "https://example.com",
        supportUrl: project.supportUrl || "https://example.com",
        thumbnailUrl: project.thumbnailUrl || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(project.name || "project")}`,
        createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
        updatedAt: new Date()
      }
    });

    projectMap.set(project.id, created.id);
    insertedProjects += 1;
  }

  for (const event of json.events || []) {
    await prisma.analyticsEvent.create({
      data: {
        id: event.id,
        type: event.type,
        projectId: event.projectId ? projectMap.get(event.projectId) || null : null,
        sessionId: event.sessionId || "legacy-session",
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
        metadata: event.metadata || undefined
      }
    });
    insertedEvents += 1;
  }

  for (const feedback of json.feedback || []) {
    const mappedProjectId = projectMap.get(feedback.projectId);
    if (!mappedProjectId) continue;

    await prisma.feedback.create({
      data: {
        id: feedback.id,
        projectId: mappedProjectId,
        sessionId: feedback.sessionId || "legacy-session",
        comment: feedback.comment || "",
        sentiment: feedback.sentiment || "neutral",
        createdAt: feedback.createdAt ? new Date(feedback.createdAt) : new Date()
      }
    });
    insertedFeedback += 1;
  }

  const counts = {
    projects: await prisma.project.count(),
    events: await prisma.analyticsEvent.count(),
    feedback: await prisma.feedback.count()
  };

  console.log("Migration complete");
  console.log({ insertedProjects, insertedEvents, insertedFeedback, counts });
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
