import type { Route } from "next";
import type { Metadata } from "next";
import Link from "next/link";
import { FileText, LayoutTemplate, Rocket } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import MarketingShell from "@/components/MarketingShell";
import ProjectEditor from "@/components/ProjectEditor";
import RegisterForm from "@/components/RegisterForm";
import { auth } from "@/lib/auth";
import { buildLoginHref } from "@/lib/auth-routing";
import { getProjectById } from "@/lib/data-store";
import { canManageProject } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Register Service | feedback4U",
  description: "Register your service and collect feedback through feedback4U."
};

type RegisterPageProps = {
  searchParams: Promise<{
    edit?: string;
  }>;
};

const infoCards = [
  {
    icon: Rocket,
    title: "Fast Setup",
    description: "핵심 정보만 입력하면 공개 탐색 카드와 상세 페이지가 바로 연결됩니다."
  },
  {
    icon: LayoutTemplate,
    title: "Structured Story",
    description: "서비스 소개, 문제, 해결 방식, 운영 링크를 한 번에 정리할 수 있습니다."
  },
  {
    icon: FileText,
    title: "Flexible Detail",
    description: "간단한 입력부터 긴 설명형 문서까지 같은 화면에서 관리할 수 있습니다."
  }
];

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { edit } = await searchParams;
  const session = await auth();
  const callbackUrl = edit ? `/register?edit=${encodeURIComponent(edit)}` : "/register";

  if (!session?.user?.id) {
    redirect(buildLoginHref(callbackUrl) as Route);
  }

  if (edit) {
    const project = await getProjectById(edit);
    if (!project || !canManageProject(session, project.ownerId)) {
      notFound();
    }

    return (
      <MarketingShell>
        <section className="page-container py-8 lg:py-10">
          <div className="grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="panel-card bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_52%,#e3f1ff_100%)] px-6 py-7 sm:px-7">
              <p className="section-eyebrow">Edit Service</p>
              <h1 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Keep your service page
                <br />
                concise and current.
              </h1>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                공개 소개 문구, 운영 링크, 상세 콘텐츠를 한 화면에서 빠르게 업데이트할 수 있습니다.
              </p>

              <div className="mt-6 space-y-3">
                {infoCards.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="soft-card px-4 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[#eef5ff] text-[#1d79d8]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-lg font-black text-slate-950">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                  </div>
                ))}
              </div>

              <Link href="/dashboard?hub=platform" className="mt-6 inline-flex brand-button-secondary">
                워크스페이스로 돌아가기
              </Link>
            </div>

            <ProjectEditor project={project} />
          </div>
        </section>
      </MarketingShell>
    );
  }

  return (
    <MarketingShell>
      <section className="page-container py-8 lg:py-10">
        <div className="grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="panel-card bg-[linear-gradient(135deg,#8ec0ff_0%,#5d9eef_36%,#a9d3ff_100%)] px-6 py-7 text-white sm:px-7">
            <p className="section-eyebrow text-white/90">Register Service</p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Publish your service
              <br />
              without wasting steps.
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/86 sm:text-base">
              서비스 소개, 링크, 상세 설명을 한 번에 정리해 탐색 페이지와 상세 페이지에 바로 반영합니다.
            </p>

            <div className="mt-6 space-y-3">
              {infoCards.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-[22px] border border-white/30 bg-white/12 px-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-white/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-lg font-black text-white">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/82">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <RegisterForm />
        </div>
      </section>
    </MarketingShell>
  );
}
