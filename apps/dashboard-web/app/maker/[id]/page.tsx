import type { Metadata } from "next";
import { BriefcaseBusiness, MessageSquareText, ThumbsUp, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import FollowButton from "@/components/FollowButton";
import MarketingShell from "@/components/MarketingShell";
import SectionHeader from "@/components/SectionHeader";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectStatusMeta, type ProjectStatusTone } from "@/lib/project-status";

const STATUS_TONE_STYLES: Record<ProjectStatusTone, string> = {
  idea: "border-slate-200 bg-slate-100 text-slate-700",
  developing: "border-orange-200 bg-orange-50 text-orange-700",
  released: "border-emerald-200 bg-emerald-50 text-emerald-700",
  paused: "border-rose-200 bg-rose-50 text-rose-700",
  pivoted: "border-amber-200 bg-amber-50 text-amber-700"
};

type MakerPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: MakerPageProps): Promise<Metadata> {
  const { id } = await params;
  const maker = await prisma.user.findUnique({
    where: { id },
    select: { name: true }
  });

  return {
    title: maker?.name ? `${maker.name} | feedback4U` : "Maker Profile | feedback4U"
  };
}

export default async function MakerProfilePage({ params }: MakerPageProps) {
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

  const isFollowing = session?.user?.id ? maker.followers.some((item) => item.followerId === session.user.id) : false;
  const totalVotes = maker.ownedProjects.reduce((sum, project) => sum + (project.voteCount || 0), 0);
  const totalFeedback = maker.ownedProjects.reduce((sum, project) => sum + (project.commentCount || 0), 0);
  const displayName = maker.name || "Anonymous Builder";

  return (
    <MarketingShell>
      <section className="page-container py-8 lg:py-10">
        <Link href="/explore" className="brand-button-secondary px-5 py-2.5">
          Explore services
        </Link>

        <section className="panel-card mt-5 overflow-hidden bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_56%,#dfefff_100%)] px-6 py-6 sm:px-7">
          <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
            <div className="mx-auto flex h-[152px] w-[152px] items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-[0_20px_44px_-28px_rgba(23,68,129,0.38)]">
              {maker.image ? (
                <Image src={maker.image} alt={displayName} width={152} height={152} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#1d79d8] text-5xl font-black text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <SectionHeader
                eyebrow="Maker Profile"
                title={displayName}
                description="공개한 서비스, 반응 수치, 팔로우 상태를 한 화면에서 빠르게 확인할 수 있습니다."
              />

              <div className="mt-5 flex flex-wrap gap-3">
                <FollowButton
                  targetUserId={maker.id}
                  initialIsFollowing={isFollowing}
                  followerCount={maker.followers.length}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            { icon: BriefcaseBusiness, value: maker.ownedProjects.length, label: "Projects" },
            { icon: Users, value: maker.followers.length, label: "Followers" },
            { icon: ThumbsUp, value: totalVotes, label: "Votes" },
            { icon: MessageSquareText, value: totalFeedback, label: "Feedback" }
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="metric-card">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#eef5ff] text-[#1d79d8]">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-3xl font-black text-slate-950">
                {new Intl.NumberFormat("ko-KR").format(value)}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <section className="mt-6">
          <SectionHeader
            eyebrow="Projects by this maker"
            title="Published services"
            description="이 빌더가 공개한 서비스들을 더 촘촘한 카드 레이아웃으로 확인할 수 있습니다."
          />

          {maker.ownedProjects.length === 0 ? (
            <div className="panel-card mt-5 px-6 py-12 text-center">
              <p className="text-2xl font-black text-slate-950">아직 공개된 서비스가 없습니다.</p>
              <p className="mt-3 text-sm leading-6 text-slate-500">첫 프로젝트가 등록되면 이곳에서 바로 확인할 수 있습니다.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {maker.ownedProjects.map((project) => {
                const statusMeta = getProjectStatusMeta(project.status);

                return (
                  <Link
                    href={`/project/${project.id}`}
                    key={project.id}
                    className="group overflow-hidden rounded-[26px] border border-[#dce8f7] bg-white shadow-[0_20px_44px_-32px_rgba(23,68,129,0.32)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_-28px_rgba(23,68,129,0.36)]"
                  >
                    <div className="relative h-48 overflow-hidden bg-[#edf5ff]">
                      <Image
                        src={project.thumbnailUrl}
                        alt={`${project.name} thumbnail`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      />
                      <span className={`absolute left-4 top-4 inline-flex rounded-full border px-3 py-1 text-xs font-black backdrop-blur-sm ${STATUS_TONE_STYLES[statusMeta.tone]}`}>
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="space-y-3 px-4 py-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-950">{project.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{project.tagline}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="rounded-[18px] border border-[#dce8f7] bg-[#f8fbff] px-3 py-3 text-center">
                          <p className="text-2xl font-black text-slate-950">{project.voteCount || 0}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">Votes</p>
                        </div>
                        <div className="rounded-[18px] border border-[#dce8f7] bg-[#f8fbff] px-3 py-3 text-center">
                          <p className="text-2xl font-black text-slate-950">{project.commentCount || 0}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">Feedback</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </MarketingShell>
  );
}
