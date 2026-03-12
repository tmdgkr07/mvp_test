import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import FollowButton from "@/components/FollowButton";
import { getProjectStatusMeta, type ProjectStatusTone } from "@/lib/project-status";

const STATUS_TONE_STYLES: Record<ProjectStatusTone, string> = {
    idea: "bg-gray-100 text-gray-700 border-gray-200",
    developing: "bg-orange-50 text-orange-700 border-orange-200",
    released: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paused: "bg-red-50 text-red-700 border-red-200",
    pivoted: "bg-yellow-50 text-yellow-800 border-yellow-200"
};

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
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
            {/* Background Decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-40 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-10 w-96 h-96 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10">
                <div className="mx-auto max-w-5xl px-5 py-8 md:py-12">
                    {/* Back Button */}
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-2 group mb-8 px-4 py-2.5 rounded-full bg-white/60 hover:bg-white backdrop-blur-md border border-slate-200/50 hover:border-slate-300 transition-all shadow-sm hover:shadow-md"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        <span className="text-sm font-semibold text-slate-700">게시판으로 돌아가기</span>
                    </Link>

                    {/* Maker Profile Card */}
                    <section className="mt-8 bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 md:p-12 border border-slate-200/60 shadow-xl mb-16">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <div className="relative h-32 w-32 md:h-40 md:w-40 overflow-hidden rounded-full shadow-2xl border-4 border-white ring-4 ring-purple-200/50 group">
                                    {maker.image ? (
                                        <Image 
                                            src={maker.image} 
                                            alt={maker.name || "Maker"} 
                                            fill 
                                            className="object-cover" 
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-400 to-pink-500 text-5xl md:text-6xl font-black text-white">
                                            {(maker.name || "M").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info & CTA */}
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3">
                                    {maker.name || "익명의 메이커"}
                                </h1>

                                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-8">
                                    <div className="flex items-center gap-6 flex-wrap justify-center md:justify-start">
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-purple-200/50">
                                            <span className="text-2xl">🚀</span>
                                            <span className="font-bold text-slate-700">{maker.ownedProjects.length}개 프로젝트</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-pink-100 border border-orange-200/50">
                                            <span className="text-2xl">👥</span>
                                            <span className="font-bold text-slate-700">{maker.followers.length}명 팔로우</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Follow Button */}
                                <div className="flex justify-center md:justify-start">
                                    <FollowButton
                                        targetUserId={maker.id}
                                        initialIsFollowing={isFollowing}
                                        followerCount={maker.followers.length}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Projects Section */}
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="text-4xl">🎨</span>
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900">
                                    메이커의 프로젝트
                                </h2>
                                <p className="text-slate-600 mt-1">총 {maker.ownedProjects.length}개의 멋진 프로젝트</p>
                            </div>
                        </div>

                        {maker.ownedProjects.length === 0 ? (
                            <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 p-12 text-center">
                                <p className="text-2xl mb-3">📭</p>
                                <p className="text-lg font-semibold text-slate-600">아직 등록된 프로젝트가 없습니다</p>
                                <p className="text-slate-500 mt-2">메이커가 첫 번째 프로젝트를 등록할 때까지 기다려주세요!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {maker.ownedProjects.map(project => (
                                    <Link 
                                        href={`/project/${project.id}`} 
                                        key={project.id} 
                                        className="group block h-full overflow-hidden rounded-3xl bg-white shadow-md hover:shadow-2xl border border-slate-200/60 transition-all duration-300 hover:-translate-y-2"
                                    >
                                        {/* Image Container */}
                                        <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                                            <Image 
                                                src={project.thumbnailUrl} 
                                                alt={`${project.name} 썸네일`} 
                                                fill 
                                                className="object-cover group-hover:scale-110 transition-transform duration-500" 
                                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" 
                                            />
                                            {/* Status Badge Overlay */}
                                            <div className="absolute top-4 left-4">
                                                {project.status && (
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-sm ${STATUS_TONE_STYLES[getProjectStatusMeta(project.status).tone]}`}>
                                                        <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
                                                        {getProjectStatusMeta(project.status).label}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Vote Badge */}
                                            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-rose-500/90 text-white text-xs font-bold shadow-lg backdrop-blur-sm flex items-center gap-1.5">
                                                <span>🔥</span>
                                                <span>{project.voteCount || 0}</span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 flex flex-col h-40">
                                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-2 mb-2">
                                                {project.name}
                                            </h3>
                                            <p className="text-sm text-slate-600 line-clamp-3 flex-1 mb-4">
                                                {project.tagline}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span>더 보기</span>
                                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}
