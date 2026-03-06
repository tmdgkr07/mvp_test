import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import FollowButton from "@/components/FollowButton";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    IDEA: { label: "아이디어", color: "bg-gray-100 text-gray-700 border-gray-200" },
    VALIDATING: { label: "검증 중", color: "bg-blue-50 text-blue-700 border-blue-200" },
    DEVELOPING: { label: "개발 중", color: "bg-orange-50 text-orange-700 border-orange-200" },
    RELEASED: { label: "출시 완료", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    GROWING: { label: "성장 중", color: "bg-purple-50 text-purple-700 border-purple-200" },
    PAUSED: { label: "일시 중단", color: "bg-red-50 text-red-700 border-red-200" },
    PIVOTED: { label: "피봇", color: "bg-yellow-50 text-yellow-800 border-yellow-200" }
};

export default async function MakerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

    const maker = await prisma.user.findUnique({
        where: { id },
        include: {
            ownedProjects: {
                where: { deletedAt: null },
                orderBy: { createdAt: "desc" }
            },
            followers: true
        }
    });

    if (!maker) {
        notFound();
    }

    const isFollowing = session?.user?.id
        ? maker.followers.some((f) => f.followerId === session.user.id)
        : false;

    return (
        <main className="mx-auto max-w-4xl px-5 py-12">
            <Link href="/" className="inline-block rounded-full bg-ink/10 px-4 py-2 text-sm font-semibold hover:bg-ink/20 text-ink/80 transition-all">
                ← 게시판으로 돌아가기
            </Link>

            {/* Maker Header Card */}
            <section className="mt-8 flex flex-col items-center justify-between gap-6 sm:flex-row bg-white rounded-3xl p-8 border border-ink/5 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="relative h-24 w-24 overflow-hidden rounded-full shadow-inner border border-ink/10">
                        {maker.image ? (
                            <Image src={maker.image} alt={maker.name || "Maker"} fill className="object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-blue-50 text-2xl font-black text-blue-600">
                                {(maker.name || "M").charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-ink">{maker.name || "Anonymous Maker"}</h1>
                        <p className="mt-2 text-sm text-ink/60 font-medium">참여 중인 프로젝트 {maker.ownedProjects.length}개</p>
                    </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto text-center sm:text-right">
                    <FollowButton
                        targetUserId={maker.id}
                        initialIsFollowing={isFollowing}
                        followerCount={maker.followers.length}
                    />
                </div>
            </section>

            {/* Projects Grid */}
            <section className="mt-12">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                    <span className="text-2xl">🚀</span> 메이커의 프로젝트
                </h2>

                {maker.ownedProjects.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-ink/20 bg-white p-10 text-center text-ink/50">
                        아직 등록된 프로젝트가 없습니다.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {maker.ownedProjects.map(project => (
                            <Link href={`/project/${project.id}`} key={project.id} className="group block overflow-hidden rounded-3xl bg-white shadow-sm border border-ink/5 transition-all hover:-translate-y-1 hover:shadow-xl">
                                <div className="relative h-48 w-full">
                                    <Image src={project.thumbnailUrl} alt={`${project.name} 썸네일`} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" />
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-3">
                                        {project.status && STATUS_LABELS[project.status] && (
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_LABELS[project.status].color}`}>
                                                {STATUS_LABELS[project.status].label}
                                            </span>
                                        )}
                                        <span className="text-xs font-semibold text-ink/50">🔥 {project.voteCount}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-ink">{project.name}</h3>
                                    <p className="mt-2 text-sm text-ink/70 line-clamp-2">{project.tagline}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
