import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ProjectDetailClient from "@/components/ProjectDetailClient";
import { getProjectById } from "@/lib/data-store";

export const revalidate = 120;
export const preferredRegion = "icn1";

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

      <article className="mt-6 overflow-hidden rounded-3xl bg-paper shadow-card">
        <div className="relative h-56 w-full sm:h-72">
          <Image src={project.thumbnailUrl} alt={`${project.name} 썸네일`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 900px" />
        </div>

        <div className="space-y-5 px-6 py-7 sm:px-10">
          <p className="text-xs font-bold uppercase tracking-widest text-support">Project Detail / SEO URL</p>
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{project.name}</h1>
          <p className="text-base leading-relaxed text-ink/80 sm:text-lg">{project.tagline}</p>

          {project.detailContent && (
            <div className="rounded-2xl border border-ink/10 bg-white p-4">
              <MarkdownRenderer content={project.detailContent} />
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <a href={project.websiteUrl} target="_blank" rel="noreferrer noopener" className="rounded-xl bg-ink px-5 py-3 text-center text-sm font-semibold text-white hover:bg-ink/90">
              웹사이트 바로가기
            </a>
            <a href={project.supportUrl} target="_blank" rel="noreferrer noopener" className="rounded-xl bg-accent px-5 py-3 text-center text-sm font-semibold text-white hover:bg-accent/90">
              후원 링크 열기
            </a>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-canvas/70 p-4 text-sm text-ink/80">
            SEO/공유를 위해 고유 URL을 사용합니다. <strong>/project/{project.id}</strong>
          </div>
        </div>
      </article>

      <ProjectDetailClient project={project} />
    </main>
  );
}
