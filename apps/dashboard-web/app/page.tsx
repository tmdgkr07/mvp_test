import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

export const metadata: Metadata = {
  title: "밥주세요 | 후원과 피드백으로 검증이 남는 구조",
  description: "AI 시대 1인 빌더를 위한 서비스 검증 인프라 플랫폼."
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />

      {/* 문제 섹션 */}
      <section className="bg-[#F9F7F3] px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-sm font-bold text-[#C49B00] mb-4 tracking-widest uppercase">
            대부분 이렇게 막힙니다
          </p>
          <h2 className="text-center text-4xl sm:text-5xl font-black text-ink mb-14 leading-tight">
            만들 수는 있는데<br />다음 걸음을 모르겠어요
          </h2>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: "😤", title: "흩어진 반응 데이터", desc: "SNS, DM, 댓글, 메일을 모두 뒤져야 합니다." },
              { icon: "😵", title: "섞여버린 피드백", desc: "서비스가 여러 개면 후원, 피드백, 데이터가 섞입니다." },
              { icon: "😰", title: "불명확한 다음 단계", desc: "무엇을 고쳐야 하는지, 비용을 어떻게 감당할지 막막합니다." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-3xl bg-white border border-[#EBEBEB] p-7 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                <p className="text-4xl mb-4">{icon}</p>
                <p className="font-black text-ink text-lg mb-2">{title}</p>
                <p className="text-sm text-ink-light leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center text-sm text-ink-light bg-white border border-[#EBEBEB] rounded-3xl px-8 py-5 shadow-card">
            💡 밥주세요는 결과 화면에서 바로 후원과 피드백을 받아{" "}
            <span className="font-bold text-ink">검증 데이터와 초기 수익을 동시에 만드는 구조</span>를 제공합니다.
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-sm font-bold text-[#C49B00] mb-4 tracking-widest uppercase">
            그래서 이곳은 검증 인프라입니다
          </p>
          <h2 className="text-center text-4xl sm:text-5xl font-black text-ink mb-16 leading-tight">
            후원이 아니라,<br />검증이 남는 구조를 만듭니다
          </h2>

          <div className="space-y-8">
            {[
              { step: "1", title: "서비스를 밥주세요에 등록하세요", desc: "URL 하나로 서비스를 등록하고, 스크립트 한 줄을 결과 화면에 붙입니다. 후원 버튼과 피드백 폼이 자동으로 임베드됩니다." },
              { step: "2", title: "사용자가 결과를 보는 그 순간, 반응이 쌓입니다", desc: "밥알 5개, 밥알 10개, 밥알 30알. 후원 직후 짧은 피드백 질문으로 자연스럽게 연결됩니다." },
              { step: "3", title: "감이 아니라 데이터로 다음 방향을 결정합니다", desc: "대시보드에서 전환율, 이탈구간, 피드백 우선순위를 확인합니다. AI가 다음 업데이트 우선순위를 자동으로 제안합니다." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-6 items-start group">
                <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-ink font-black text-lg shadow-btn">
                  {step}
                </div>
                <div className="pt-1">
                  <p className="text-xl font-black text-ink mb-2 group-hover:text-[#8B6914] transition-colors">{title}</p>
                  <p className="text-sm text-ink-light leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 밥알 시스템 */}
      <section className="bg-[#F9F7F3] px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-5xl mb-5 animate-float inline-block">🍚</div>
          <h2 className="text-4xl sm:text-5xl font-black text-ink mb-4">밥알 크레딧 시스템</h2>
          <p className="text-ink-light mb-12 leading-relaxed">
            플랫폼 안에서는 돈이 아니라 응원과 피드백이 오갑니다.<br />
            1밥알 = 1,000원. 누군가의 시도를 먹여 살린다는 의미입니다.
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-3xl border border-[#EBEBEB] bg-white p-7 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
              <p className="text-2xl font-black text-ink mb-1">5 밥알</p>
              <p className="text-sm text-ink-light mb-4">₩5,000</p>
              <span className="inline-block rounded-full bg-[#F9F7F3] border border-[#EBEBEB] px-3 py-1 text-xs font-bold text-ink-light">Starter</span>
            </div>
            <div className="rounded-3xl border-2 border-accent bg-white p-7 relative shadow-card-hover -translate-y-2">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-ink text-xs font-black px-4 py-1.5 rounded-full whitespace-nowrap shadow-btn">인기</span>
              <p className="text-2xl font-black text-ink mb-1">10 밥알</p>
              <p className="text-sm text-ink-light mb-4">₩10,000</p>
              <span className="inline-block rounded-full bg-accent/20 border border-accent/40 px-3 py-1 text-xs font-bold text-[#8B6914]">Supporter</span>
            </div>
            <div className="rounded-3xl border border-[#EBEBEB] bg-white p-7 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
              <p className="text-2xl font-black text-ink mb-1">30 밥알</p>
              <p className="text-sm text-ink-light mb-4">₩30,000</p>
              <span className="inline-block rounded-full bg-[#F9F7F3] border border-[#EBEBEB] px-3 py-1 text-xs font-bold text-ink-light">Angel</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-accent px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-ink mb-5 leading-tight">
            감으로 갈지,<br />데이터로 갈지.
          </h2>
          <p className="text-ink/70 mb-12 text-lg leading-relaxed">
            좋은 아이디어가 흩어지지 않고,<br />반응과 데이터로 성장하는 구조를 만드세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="flex items-center justify-center rounded-full bg-ink hover:bg-ink/90 px-8 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 shadow-btn"
            >
              내 서비스 등록하기 →
            </Link>
            <Link
              href="/explore"
              className="flex items-center justify-center rounded-full border-2 border-ink/20 hover:border-ink/40 bg-white/50 hover:bg-white/70 px-8 py-4 text-base font-bold text-ink transition-all"
            >
              다른 서비스 둘러보기
            </Link>
          </div>

          <p className="mt-8 text-sm text-ink/60">
            ✓ 무료로 시작 &nbsp;·&nbsp; ✓ 신용카드 불필요 &nbsp;·&nbsp; ✓ 언제든 시작/중단 가능
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#EBEBEB] bg-white py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🍚</span>
                <h3 className="font-black text-ink text-lg">밥주세요</h3>
              </div>
              <p className="text-sm text-ink-light leading-relaxed">후원과 피드백으로<br />검증이 남는 구조를 만듭니다.</p>
            </div>
            <div>
              <h3 className="font-bold text-ink mb-4 text-sm uppercase tracking-widest">둘러보기</h3>
              <ul className="space-y-3 text-sm text-ink-light">
                <li><a href="/explore" className="hover:text-ink transition-colors">서비스 탐색</a></li>
                <li><a href="/dashboard" className="hover:text-ink transition-colors">빌더 대시보드</a></li>
                <li><a href="/register" className="hover:text-ink transition-colors">서비스 등록</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-ink mb-4 text-sm uppercase tracking-widest">더 알아보기</h3>
              <ul className="space-y-3 text-sm text-ink-light">
                <li><a href="#" className="hover:text-ink transition-colors">이용약관</a></li>
                <li><a href="#" className="hover:text-ink transition-colors">개인정보처리방침</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#EBEBEB] pt-6 text-center">
            <p className="text-sm text-ink-light">&copy; {new Date().getFullYear()} 밥주세요. Team 유쾌한청년들.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
