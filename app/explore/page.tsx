import type { Metadata } from "next";
import ShowcaseBoard from "@/components/ShowcaseBoard";
import { listProjects } from "@/lib/data-store";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "서비스 탐색 | 밥주세요",
  description: "밥주세요에 등록된 서비스를 탐색하고, 빌더에게 후원과 피드백을 전달하세요."
};

export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

export default async function ExplorePage() {
  const projects = await listProjects();

  return (
    <>
      <Navbar />

      <div className="bg-[#F9F7F3] border-b border-[#EBEBEB] px-6 sm:px-10 pt-14 pb-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold text-[#C49B00] uppercase tracking-widest mb-3">Explore</p>
          <h1 className="text-4xl sm:text-5xl font-black text-ink">서비스 탐색</h1>
          <p className="mt-3 text-ink-light text-lg">빌더들이 만든 서비스를 둘러보고, 후원과 피드백으로 응원해주세요.</p>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 pb-24 sm:px-10 pt-10">
        <ShowcaseBoard initialProjects={projects} />
      </main>

      <footer className="border-t border-[#EBEBEB] bg-white py-10">
        <div className="text-center">
          <p className="text-sm text-ink-light">
            &copy; {new Date().getFullYear()} 밥주세요. Team 유쾌한청년들.
          </p>
        </div>
      </footer>
    </>
  );
}
