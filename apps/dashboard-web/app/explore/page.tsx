import type { Metadata } from "next";
import { Compass, MessageSquareText, Sparkles } from "lucide-react";
import MarketingShell from "@/components/MarketingShell";
import ShowcaseBoard from "@/components/ShowcaseBoard";
import { listProjects } from "@/lib/data-store";

export const metadata: Metadata = {
  title: "Explore Services | feedback4U",
  description: "Browse feedback4U projects, compare signals, and leave feedback."
};

export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

export default async function ExplorePage() {
  const projects = await listProjects();
  const totalVotes = projects.reduce((sum, project) => sum + (project.voteCount || 0), 0);
  const totalComments = projects.reduce((sum, project) => sum + (project.commentCount || 0), 0);

  return (
    <MarketingShell>
      <section className="page-container py-6 lg:py-8">
        <div className="panel-card overflow-hidden bg-[linear-gradient(135deg,#9bc6ff_0%,#7eaeea_42%,#b9d9ff_100%)] px-6 py-6 text-white sm:px-8 sm:py-7">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-white/35 bg-white/12 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/92">
                Explore Services
              </p>
              <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
                Discover builder projects
                <br />
                and leave real signals.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/88 sm:text-base">
                검증 중인 서비스들을 빠르게 훑어보고, 반응과 피드백을 남기며 다음 업데이트 방향을 함께 만들어보세요.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-[#1d79d8] shadow-[0_14px_28px_-20px_rgba(23,68,129,0.38)] transition-all hover:-translate-y-0.5"
                >
                  서비스 등록
                </a>
                <a
                  href="/#overview"
                  className="inline-flex items-center justify-center rounded-full border border-white/55 bg-white/12 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/18"
                >
                  서비스 소개
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { icon: Compass, value: projects.length, label: "Services" },
                { icon: Sparkles, value: totalVotes, label: "Votes" },
                { icon: MessageSquareText, value: totalComments, label: "Feedback" }
              ].map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="rounded-[24px] border border-white/45 bg-white/88 px-4 py-4 text-slate-950 shadow-[0_18px_36px_-28px_rgba(23,68,129,0.32)]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#eef5ff] text-[#1d79d8]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-2xl font-black">{new Intl.NumberFormat("en-US").format(value)}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <ShowcaseBoard initialProjects={projects} />
        </div>
      </section>
    </MarketingShell>
  );
}
