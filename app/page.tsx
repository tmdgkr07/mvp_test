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

      {/* Enhanced Footer */}
      <footer className="border-t border-slate-200/50 bg-gradient-to-b from-slate-50 to-white py-16 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="font-bold text-slate-900 mb-4">MVP HUB</h3>
              <p className="text-sm text-slate-600">빌더를 위한 궁극의 MVP 홍보 플랫폼입니다.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-4">둘러보기</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="/" className="hover:text-purple-600 transition-colors">탐색</a></li>
                <li><a href="/dashboard" className="hover:text-purple-600 transition-colors">대시보드</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-4">더 알아보기</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-purple-600 transition-colors">이용약관</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">개인정보</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-200 pt-8 text-center">
            <p className="text-sm font-semibold text-slate-600">
              &copy; {new Date().getFullYear()} MVP HUB. Built for builders, by builders. 🚀
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
