import type { Metadata } from "next";
import AuthMenu from "@/components/AuthMenu";
import ShowcaseBoard from "@/components/ShowcaseBoard";
import { listProjects } from "@/lib/data-store";

export const metadata: Metadata = {
  title: "MVP Showcase 게시판",
  description: "MVP를 탐색하고 후원/피드백 루프를 연결하는 메인 페이지"
};

export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

export default async function HomePage() {
  const projects = await listProjects();

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="mb-4 flex justify-end">
        <AuthMenu />
      </div>
      <ShowcaseBoard initialProjects={projects} />
    </main>
  );
}
