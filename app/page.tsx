import type { Metadata } from "next";
import ShowcaseBoard from "@/components/ShowcaseBoard";
import { listProjects } from "@/lib/data-store";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

export const metadata: Metadata = {
  title: "MVP HUB | 가시적인 홍보와 투명한 피드백",
  description: "실제 동작하는 MVP를 탐색하고, 빌더에게 직접적인 후원과 피드백을 전달하세요."
};

export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

export default async function HomePage() {
  const projects = await listProjects();

  return (
    <>
      <Navbar />
      <Hero />
      <main id="projects" className="mx-auto max-w-7xl px-6 pb-24 sm:px-10">
        <ShowcaseBoard initialProjects={projects} />
      </main>

      {/* Footer */}
      <footer className="border-t border-ink/5 bg-white/30 py-12 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 text-center sm:px-10">
          <p className="text-sm font-bold text-ink/40">
            &copy; {new Date().getFullYear()} MVP HUB. Built for builders, by builders.
          </p>
        </div>
      </footer>
    </>
  );
}
