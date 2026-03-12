import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.ownerId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const waitlist = await prisma.waitlist.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        select: { email: true, createdAt: true }
    });

    return NextResponse.json({ data: { waitlist } });
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        const { email } = await request.json();

        if (!email || !email.includes("@")) {
            return NextResponse.json({ error: "Invalid email" }, { status: 400 });
        }

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        await prisma.waitlist.upsert({
            where: {
                projectId_email: {
                    projectId,
                    email,
                },
            },
            create: {
                projectId,
                email,
            },
            update: {}, // Email already in list, do nothing
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Waitlist error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
