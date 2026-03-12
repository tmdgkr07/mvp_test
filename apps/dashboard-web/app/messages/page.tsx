import type { Metadata } from "next";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import CreatorFeedbackInbox from "@/components/CreatorFeedbackInbox";
import { auth } from "@/lib/auth";
import { buildLoginHref } from "@/lib/auth-routing";
import { getProjectById } from "@/lib/data-store";
import { canManageProject } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "제작자 피드백 | 밥주세요",
  description: "후원과 함께 도착한 제작자 전용 피드백 메시지를 읽지 않음과 읽음으로 나눠 확인합니다."
};

type MessagesPageProps = {
  searchParams: Promise<{
    projectId?: string;
  }>;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const { projectId } = await searchParams;
  const session = await auth();
  const callbackUrl = projectId ? `/messages?projectId=${encodeURIComponent(projectId)}` : "/messages";

  if (!session?.user?.id) {
    redirect(buildLoginHref(callbackUrl) as Route);
  }

  let projectName: string | null = null;

  if (projectId) {
    const project = await getProjectById(projectId);
    if (!project || !canManageProject(session, project.ownerId)) {
      notFound();
    }

    projectName = project.name;
  }

  return <CreatorFeedbackInbox projectId={projectId ?? null} projectName={projectName} />;
}
