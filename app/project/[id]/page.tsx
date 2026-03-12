import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ProjectDetailClient from "@/components/ProjectDetailClient";
import VoteButton from "@/components/VoteButton";
import WaitlistButton from "@/components/WaitlistButton";
import { getProjectById } from "@/lib/data-store";
import { getProjectStatusMeta, type ProjectStatusTone } from "@/lib/project-status";

export const revalidate = 120;
export const preferredRegion = "icn1";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  IDEA: { label: "아이디어", color: "bg-gray-100 text-gray-700 border-gray-200" },
  VALIDATING: { label: "검증 중", color: "bg-blue-50 text-blue-700 border-blue-200" },
  DEVELOPING: { label: "개발 중", color: "bg-orange-50 text-orange-700 border-orange-200" },
  RELEASED: { label: "출시 완료", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  GROWING: { label: "성장 중", color: "bg-purple-50 text-purple-700 border-purple-200" },
  PAUSED: { label: "일시 중단", color: "bg-red-50 text-red-700 border-red-200" },
  PIVOTED: { label: "피봇", color: "bg-yellow-50 text-yellow-800 border-yellow-200" }
};

const STATUS_TONE_STYLES: Record<ProjectStatusTone, string> = {
  idea: "bg-gray-100 text-gray-700 border-gray-200",
  developing: "bg-orange-50 text-orange-700 border-orange-200",
  released: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-red-50 text-red-700 border-red-200",
  pivoted: "bg-yellow-50 text-yellow-800 border-yellow-200"
};

type Props = {
  params: Promise<{ id: string }>;
};

const getProjectCached = cache(async (id: string) => getProjectById(id));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectCached(id);

  if (!project) {
    return { title: "프로젝트를 찾을 수 없습니다." };
  }

  return {
    title: `${project.name} | MVP 상세`,
    description: project.tagline,
    alternates: { canonical: `/project/${project.id}` },
    openGraph: {
      title: project.name,
      description: project.tagline,
      images: [project.thumbnailUrl]
    }
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const project = await getProjectCached(id);
  if (!project) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-gradient-to-tr from-slate-200/20 to-blue-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
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

          {/* Edit Controls */}
          <div className="mb-8">
            <ProjectDetailClient project={project} />
          </div>

          <article className="flex flex-col gap-12 pb-40">
            {/* ===== Header Section ===== */}
            <div className="space-y-6">
              {/* Status & Stats Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {project.status && (
                    <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold shadow-sm transition-all ${STATUS_TONE_STYLES[getProjectStatusMeta(project.status).tone]}`}>
                      <span className="w-2 h-2 rounded-full bg-current opacity-60"></span>
                      {getProjectStatusMeta(project.status).label}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <VoteButton projectId={project.id} initialVotes={project.voteCount || 0} />
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-slate-200/50 text-sm font-semibold text-slate-700 shadow-sm">
                    <span>💬</span>
                    <span>{project.commentCount || 0}</span>
                  </div>
                </div>
              </div>

              {/* Title Section */}
              <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                  {project.name}
                </h1>
                <p className="text-xl md:text-2xl font-semibold leading-relaxed text-slate-600 max-w-2xl">
                  {project.tagline}
                </p>

                {/* Maker Profile Link */}
                {project.ownerId && (
                  <Link 
                    href={`/maker/${project.ownerId}`} 
                    className="inline-flex items-center gap-3 mt-6 group px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-200/50 hover:border-purple-300/50 transition-all shadow-sm hover:shadow-md"
                  >
                    <span className="group-hover:scale-110 transition-transform text-lg">🧑‍💻</span>
                    <span className="font-semibold text-slate-700">메이커 프로필 보기</span>
                    <span className="group-hover:translate-x-1 transition-transform text-slate-400">→</span>
                  </Link>
                )}
              </div>
            </div>

            {/* ===== Hero Image Section ===== */}
            <div className="relative group overflow-hidden rounded-3xl shadow-2xl border border-white/50">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent z-10"></div>
              <div className="relative h-72 md:h-96 lg:h-[500px] w-full overflow-hidden">
                <Image 
                  src={project.thumbnailUrl} 
                  alt={`${project.name} 썸네일`} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  sizes="(max-width: 768px) 100vw, 1280px" 
                  priority
                />
              </div>
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 z-20"></div>
            </div>

            {/* ===== Waitlist & CTA Section ===== */}
            <div className="rounded-3xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 p-8 shadow-lg">
              <WaitlistButton projectId={project.id} />
            </div>

            {/* ===== Content Section ===== */}
            {project.detailContent && (
              <div className="rounded-3xl bg-white/70 backdrop-blur-sm px-8 md:px-12 py-12 border border-slate-200/50 shadow-lg prose prose-slate max-w-none
                prose-headings:font-black prose-headings:text-slate-900
                prose-p:text-slate-700 prose-p:leading-relaxed
                prose-a:text-purple-600 hover:prose-a:text-purple-700
                prose-strong:text-slate-900 prose-strong:font-bold
                prose-code:bg-slate-100 prose-code:text-slate-900 prose-code:rounded prose-code:px-2 prose-code:py-1
                prose-pre:bg-slate-900 prose-pre:text-slate-100
              ">
                <MarkdownRenderer content={project.detailContent} />
              </div>
            )}

            {/* ===== URL Info Section ===== */}
            <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 p-6 text-center">
              <p className="text-sm font-medium text-slate-700">
                🔗 SEO 최적화를 위해 고유 URL을 사용합니다
              </p>
              <p className="mt-2 font-mono text-xs md:text-sm font-bold text-slate-600 bg-white/50 rounded-lg px-4 py-2 inline-block border border-slate-200/50">
                /project/{project.id}
              </p>
            </div>
          </article>
        </div>

        {/* Sticky Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white to-white/0 px-5 pt-6 pb-8">
          <div className="mx-auto max-w-5xl flex flex-col sm:flex-row gap-3">
            <a 
              href={project.websiteUrl} 
              target="_blank" 
              rel="noreferrer noopener" 
              className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 group border border-purple-500/50"
            >
              <span>앱 둘러보기</span>
              <span className="group-hover:translate-x-1 transition-transform text-xl">🚀</span>
            </a>
            <a 
              href={project.supportUrl} 
              target="_blank" 
              rel="noreferrer noopener" 
              className="flex flex-1 sm:flex-none sm:w-48 items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 group border border-amber-500/50"
            >
              <span>후원하기</span>
              <span className="group-hover:scale-110 transition-transform text-xl">🍚</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
