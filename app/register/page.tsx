import type { Route } from "next";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ProjectEditor from "@/components/ProjectEditor";
import RegisterForm from "@/components/RegisterForm";
import { auth } from "@/lib/auth";
import { buildLoginHref } from "@/lib/auth-routing";
import { getProjectById } from "@/lib/data-store";
import { canManageProject } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "MVP 등록",
  description: "프로젝트 URL과 후원 URL을 입력해 MVP를 등록하거나 수정하세요."
};

type RegisterPageProps = {
  searchParams: Promise<{
    edit?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { edit } = await searchParams;
  const session = await auth();
  const callbackUrl = edit ? `/register?edit=${encodeURIComponent(edit)}` : "/register";

  if (!session?.user?.id) {
    redirect(buildLoginHref(callbackUrl) as Route);
  }

  if (!edit) {
    return <RegisterForm />;
  }

  const project = await getProjectById(edit);

  if (!project || !canManageProject(session, project.ownerId)) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-support">Edit Project</p>
          <h1 className="mt-2 text-3xl font-black text-ink">기존 서비스 수정</h1>
          <p className="mt-2 text-sm text-ink/70">
            기존 등록 내용을 불러왔습니다. 필요한 항목만 바로 수정하면 됩니다.
          </p>
        </div>
        <Link
          href="/dashboard?hub=platform"
          className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
        >
          플랫폼 허브로 돌아가기
        </Link>
      </div>

      <ProjectEditor project={project} />
    </main>
  );
}
