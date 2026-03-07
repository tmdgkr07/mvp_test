import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: targetUserId } = await params;
        const currentUserId = session.user.id;

        if (targetUserId === currentUserId) {
            return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
        }

        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: targetUserId,
                },
            },
        });

        if (existingFollow) {
            await prisma.follow.delete({ where: { id: existingFollow.id } });
            return NextResponse.json({ followed: false });
        } else {
            await prisma.follow.create({
                data: { followerId: currentUserId, followingId: targetUserId },
            });
            return NextResponse.json({ followed: true });
        }
    } catch (error) {
        console.error("Follow error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
