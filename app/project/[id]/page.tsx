import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ProjectDetailClient from "@/components/ProjectDetailClient";
import VoteButton from "@/components/VoteButton";
import { getProjectById } from "@/lib/data-store";

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
    <main className="mx-auto max-w-4xl px-5 py-12">
      <Link href="/" className="inline-block rounded-full bg-ink/10 px-4 py-2 text-sm font-semibold hover:bg-ink/20">
        메인 게시판으로
      </Link>

      <article className="mt-8 flex flex-col gap-10 pb-32">
        {/* Header Section: Badge, Social stats, Title */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {project.status && STATUS_LABELS[project.status] && (
              <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-bold shadow-sm ${STATUS_LABELS[project.status].color}`}>
                {STATUS_LABELS[project.status].label}
              </span>
            )}

            <div className="flex items-center gap-4 text-sm font-bold text-ink/70">
              <VoteButton projectId={project.id} initialVotes={project.voteCount || 0} />
              <span className="flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1.5">
                💬 {project.commentCount || 0}
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-black tracking-tight text-ink sm:text-6xl">{project.name}</h1>
            <p className="mt-4 text-xl font-medium leading-relaxed text-ink/75 sm:text-2xl">{project.tagline}</p>
          </div>
        </div>

        {/* Thumbnail Hero Section */}
        <div className="relative h-64 w-full overflow-hidden rounded-[2rem] shadow-md sm:h-96">
          <Image src={project.thumbnailUrl} alt={`${project.name} 썸네일`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 900px" />
        </div>

        {/* Markdown Content Section */}
        {project.detailContent && (
          <div className="rounded-[2rem] bg-white px-6 py-10 shadow-sm sm:px-12 border border-ink/5">
            <MarkdownRenderer content={project.detailContent} />
          </div>
        )}

        <div className="rounded-2xl border border-ink/10 bg-canvas/70 p-4 text-center text-sm text-ink/80">
          SEO/공유를 위해 고유 URL을 사용합니다.<br className="sm:hidden" /> <strong className="ml-2">/project/{project.id}</strong>
        </div>
      </article>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-6 left-0 right-0 z-40 px-5">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row rounded-3xl bg-white/70 p-4 shadow-2xl backdrop-blur-xl border border-ink/10">
          <a href={project.websiteUrl} target="_blank" rel="noreferrer noopener" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-4 text-center text-lg font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-ink/90">
            앱 둘러보기 🚀
          </a>
          <a href={project.supportUrl} target="_blank" rel="noreferrer noopener" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-support px-6 py-4 text-center text-lg font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-support/90 sm:flex-none sm:w-1/3">
            후원하기 ☕
          </a>
        </div>
      </div>

      <ProjectDetailClient project={project} />
    </main>
  );
}
