import { NextResponse } from "next/server";
import { voteProject } from "@/lib/data-store";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // In a real app, we might prevent multiple votes via IP/Session tracking,
        // but for now anyone can vote to show the dynamic popping effect.
        const updated = await voteProject(id);

        if (!updated) {
            return NextResponse.json(
                { error: { code: "NOT_FOUND", message: "프로젝트를 찾을 수 없습니다." } },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: { project: updated } });
    } catch (err) {
        console.error("Failed to vote project:", err);
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다." } },
            { status: 500 }
        );
    }
}
