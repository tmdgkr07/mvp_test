import type { Metadata } from "next";
import ShowcaseBoard from "@/components/ShowcaseBoard";
import { listProjects } from "@/lib/data-store";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "서비스 탐색 | MINI-TIPS",
  description: "MINI-TIPS에 등록된 서비스를 탐색하고, 빌더에게 후원과 피드백을 전달하세요."
};

export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

export default async function ExplorePage() {
  const projects = await listProjects();

  return (
    <>
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 pt-32 pb-4 sm:px-10">
        <h1 className="text-3xl font-black text-slate-900">서비스 탐색</h1>
        <p className="mt-2 text-sm text-slate-500">빌더들이 만든 서비스를 둘러보고, 후원과 피드백으로 응원해주세요.</p>
      </div>

      <main className="mx-auto max-w-7xl px-6 pb-24 sm:px-10">
        <ShowcaseBoard initialProjects={projects} />
      </main>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="text-center">
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} MINI-TIPS. Team 유쾌한청년들.
          </p>
        </div>
      </footer>
    </>
  );
}
