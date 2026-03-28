import type { Metadata } from "next";
import { ArrowUpRight, CalendarDays, MessageSquareText, UserCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import MarketingShell from "@/components/MarketingShell";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ProjectDetailClient from "@/components/ProjectDetailClient";
import SectionHeader from "@/components/SectionHeader";
import VoteButton from "@/components/VoteButton";
import WaitlistButton from "@/components/WaitlistButton";
import { getProjectById } from "@/lib/data-store";
import { getProjectStatusMeta, type ProjectStatusTone } from "@/lib/project-status";

export const revalidate = 120;
export const preferredRegion = "icn1";

const STATUS_TONE_STYLES: Record<ProjectStatusTone, string> = {
  idea: "border-slate-200 bg-slate-100 text-slate-700",
  developing: "border-orange-200 bg-orange-50 text-orange-700",
  released: "border-emerald-200 bg-emerald-50 text-emerald-700",
  paused: "border-rose-200 bg-rose-50 text-rose-700",
  pivoted: "border-amber-200 bg-amber-50 text-amber-700"
};

type Props = {
  params: Promise<{ id: string }>;
};

const getProjectCached = cache(async (id: string) => getProjectById(id));

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(value));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectCached(id);

  if (!project) {
    return { title: "Project not found" };
  }

  return {
    title: `${project.name} | feedback4U`,
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

  const statusMeta = getProjectStatusMeta(project.status);

  return (
    <MarketingShell>
      <section className="page-container py-8 lg:py-10">
        <Link href="/explore" className="brand-button-secondary px-5 py-2.5">
          Explore services
        </Link>

        <ProjectDetailClient project={project} />

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.24fr)_320px]">
          <div className="space-y-5">
            <section className="panel-card overflow-hidden bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_54%,#dfefff_100%)] px-6 py-6 sm:px-7">
              <div className="grid gap-6 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex rounded-full border px-4 py-2 text-xs font-black ${STATUS_TONE_STYLES[statusMeta.tone]}`}>
                      {statusMeta.label}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#dce8f7] bg-white px-4 py-2 text-xs font-semibold text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(project.createdAt)}
                    </span>
                  </div>

                  <h1 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{project.name}</h1>
                  <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">{project.tagline}</p>

                  {project.tags && project.tags.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={`${project.id}-${tag}`}
                          className="rounded-full border border-[#dce8f7] bg-white px-3 py-1 text-xs font-semibold text-slate-500"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href={project.websiteUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="brand-button gap-2"
                    >
                      Visit service
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                    <a
                      href={project.supportUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="brand-button-secondary gap-2"
                    >
                      Support page
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>

                  {project.ownerId ? (
                    <Link
                      href={`/maker/${project.ownerId}`}
                      className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#dce8f7] bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-[#1d79d8] hover:text-[#1d79d8]"
                    >
                      <UserCircle2 className="h-4 w-4" />
                      View maker
                    </Link>
                  ) : null}
                </div>

                <div className="relative overflow-hidden rounded-[26px] border border-[#dce8f7] bg-white shadow-[0_20px_44px_-32px_rgba(23,68,129,0.36)]">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={project.thumbnailUrl}
                      alt={`${project.name} thumbnail`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 42vw"
                      priority
                    />
                  </div>
                </div>
              </div>
            </section>

            {project.detailContent ? (
              <section className="panel-card px-6 py-6 sm:px-7 sm:py-7">
                <SectionHeader
                  eyebrow="Service Story"
                  title="Project detail"
                  description="빌더가 직접 정리한 설명과 업데이트 배경을 한 번에 확인할 수 있습니다."
                />
                <div className="prose prose-slate mt-6 max-w-none prose-headings:font-black prose-headings:text-slate-950 prose-p:leading-7 prose-p:text-slate-600">
                  <MarkdownRenderer content={project.detailContent} />
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section className="soft-card px-5 py-5">
              <p className="section-eyebrow">Quick Stats</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="metric-card">
                  <p className="text-3xl font-black text-slate-950">{project.voteCount || 0}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Votes</p>
                </div>
                <div className="metric-card">
                  <p className="text-3xl font-black text-slate-950">{project.commentCount || 0}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Feedback</p>
                </div>
              </div>

              <div className="mt-4">
                <VoteButton projectId={project.id} initialVotes={project.voteCount || 0} />
              </div>
            </section>

            <WaitlistButton projectId={project.id} />

            <section className="soft-card px-5 py-5">
              <p className="section-eyebrow">Overview</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-[20px] border border-[#dce8f7] bg-[#f8fbff] px-4 py-3.5">
                  <p className="text-sm font-black text-slate-950">Status</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{statusMeta.label}</p>
                </div>
                <div className="rounded-[20px] border border-[#dce8f7] bg-[#f8fbff] px-4 py-3.5">
                  <p className="flex items-center gap-2 text-sm font-black text-slate-950">
                    <MessageSquareText className="h-4 w-4 text-[#1d79d8]" />
                    Feedback flow
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    상세 페이지에서 서비스 방문, 후원, 대기열 참여까지 한 흐름으로 이어집니다.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </MarketingShell>
  );
}
