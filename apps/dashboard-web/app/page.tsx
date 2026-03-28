import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  CircleGauge,
  ClipboardCheck,
  Coins,
  Database,
  ShieldCheck,
  Users,
  Wrench
} from "lucide-react";
import MarketingShell from "@/components/MarketingShell";
import { getGlobalStats, listProjects } from "@/lib/data-store";

export const metadata: Metadata = {
  title: "feedback4U | The AI Builder Support Platform",
  description: "feedback4U helps builders collect verified reactions, feedback, and proof signals in one place."
};

export const dynamic = "force-dynamic";

const featureCards = [
  { title: "Free Start", icon: Coins },
  { title: "No Card Needed", icon: BadgeCheck },
  { title: "Quick Registration", icon: CircleGauge }
];

const challengeCards = [
  { title: "Data Scarcity", icon: Database },
  { title: "Verification Gaps", icon: ClipboardCheck },
  { title: "Integration Issues", icon: Wrench }
];

const infrastructureCards = [
  { title: "Secure Environment", icon: ShieldCheck },
  { title: "Cumulative Evidence", icon: ClipboardCheck },
  { title: "Expert Builder Network", icon: Users }
];

export default async function HomePage() {
  const [stats, projects] = await Promise.all([getGlobalStats(), listProjects()]);
  const totalFeedback = projects.reduce((sum, project) => sum + (project.commentCount || 0), 0);

  const heroStats = [
    { label: "Services", value: stats.totalProjects },
    { label: "Feedback", value: totalFeedback },
    { label: "Builders", value: stats.totalUsers }
  ];

  const summaryStats = [
    { label: "Services", value: stats.totalProjects },
    { label: "Feedback", value: totalFeedback },
    { label: "Builders", value: stats.totalUsers }
  ];

  return (
    <MarketingShell>
      <main>
        <section
          className="overflow-hidden px-6 pb-16 pt-16 lg:pb-20 lg:pt-20"
          style={{ background: "linear-gradient(135deg, #8cb2e0 0%, #c9dcf0 100%)" }}
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-black leading-[1.05] text-white md:text-5xl lg:text-6xl">
                feedback4U: The AI Builder Support Platform.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-blue-50 md:text-xl">
                Accelerate your AI development with verified feedback and robust infrastructure.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <Link href="/register" className="brand-button px-8 py-3.5 text-base font-semibold">
                  Register Service
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center rounded-full border-2 border-white bg-transparent px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white hover:text-[#1d79d8]"
                >
                  Explore Services
                </Link>
              </div>

              <div className="mt-10 flex gap-2">
                {[0, 1, 2, 3, 4].map((dot) => (
                  <span
                    key={dot}
                    className={dot === 0 ? "h-2 w-8 rounded-full bg-[#1d79d8]" : "h-2 w-2 rounded-full bg-blue-300"}
                  />
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <img
                alt="AI Infrastructure"
                className="h-auto w-full object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDps3WKlOv922-6YgRz5cad26I4XMvmNaAlk4ylCtV2vtr0vB37F2KtKgnPmnclnW-HLgBwF0Ca30w4Plz5fQI_hrfXJvQtOS6KRtrtjhtJE25m9_S_87XIFPZH-6b4Wds2zvOiqCvK6PJRaNG8mnNAYLRLGpnkIJG1CHPAmJh53YqXQGrF4xKrkp04yyRmJ1GGEXIXcsqZxjlZVaM-4kLgiq5zjWxwRE_ErdqS58Tf3YZyVhkssnQUaIRRCnJj5Vk5AuukNUPxA"
                style={{ mixBlendMode: "multiply" }}
              />
            </div>
          </div>
        </section>

        <section id="overview" className="relative z-20 mx-auto -mt-12 max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {featureCards.map(({ title, icon: Icon }) => (
              <div
                key={title}
                className="rounded-[28px] bg-white px-8 py-9 text-center shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.01)] transition-transform hover:-translate-y-1"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-700">
                  <Icon className="h-10 w-10" strokeWidth={1.7} />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-gray-900">{title}</h3>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 pt-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {heroStats.map((item) => (
              <div
                key={item.label}
                className="rounded-[28px] bg-white px-8 py-8 text-center shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.01)]"
              >
                <span className="block text-5xl font-black text-gray-900">{new Intl.NumberFormat("en-US").format(item.value)}</span>
                <span className="mt-2 block text-lg font-medium text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto my-4 max-w-7xl px-6">
          <div className="border-t border-gray-200" />
        </div>

        <section className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="mb-10 text-center text-3xl font-bold text-gray-900 md:text-4xl">Key Challenges &amp; Solutions</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {challengeCards.map(({ title, icon: Icon }) => (
              <div
                key={title}
                className="rounded-[24px] border border-gray-100 bg-white px-8 py-8 text-center shadow-sm"
              >
                <Icon className="mx-auto mb-4 h-12 w-12 text-gray-700" strokeWidth={1.5} />
                <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="mb-10 text-center text-3xl font-bold text-gray-900 md:text-4xl">Our Verified Infrastructure</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {infrastructureCards.map(({ title, icon: Icon }) => (
              <div
                key={title}
                className="rounded-[24px] border border-gray-100 bg-white px-8 py-8 text-center shadow-sm"
              >
                <Icon className="mx-auto mb-4 h-12 w-12 text-gray-700" strokeWidth={1.5} />
                <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-14 text-center">
          <h2 className="mb-10 text-2xl font-bold text-gray-900">Stats &amp; Builders</h2>
          <div className="grid grid-cols-3 gap-4">
            {summaryStats.map((item) => (
              <div key={item.label}>
                <div className="text-4xl font-black text-gray-900 md:text-5xl">
                  {new Intl.NumberFormat("en-US").format(item.value)}
                </div>
                <div className="mt-2 text-sm text-gray-600 md:text-base">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 bg-[#f8f9fa] px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-10 text-3xl font-bold leading-snug text-gray-900 md:text-4xl">
              Scale with Confidence,
              <br />
              Backed by Data.
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register" className="brand-button px-8 py-3.5 text-base font-medium">
                Register Service
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center rounded-full border-2 border-slate-800 bg-transparent px-8 py-3.5 text-base font-medium text-slate-800 transition-colors hover:bg-slate-100"
              >
                Explore Services
              </Link>
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
