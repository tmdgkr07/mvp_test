import Link from "next/link";
import {
  BarChart3,
  BrainCircuit,
  CloudUpload,
  PieChart,
  Server,
  ShieldCheck
} from "lucide-react";

const FLOATING_WIDGETS = [
  { icon: CloudUpload, label: "Launch", className: "left-2 top-4 sm:left-0" },
  { icon: ShieldCheck, label: "Verify", className: "right-10 top-0 sm:right-6" },
  { icon: BrainCircuit, label: "AI", className: "right-0 top-12 sm:right-0" },
  { icon: BarChart3, label: "Insights", className: "left-6 bottom-10 sm:left-10" },
  { icon: PieChart, label: "Signals", className: "right-2 bottom-6 sm:right-4" }
];

export default function Hero() {
  return (
    <section className="panel-card relative overflow-hidden bg-[linear-gradient(135deg,#9bc6ff_0%,#7eaeea_42%,#b9d9ff_100%)] px-8 pb-16 pt-10 text-white sm:px-12 sm:pb-20 sm:pt-14">
      <div className="absolute left-[-56px] top-[-68px] h-52 w-52 rounded-full bg-white/22 blur-3xl" />
      <div className="absolute bottom-[-92px] right-[-64px] h-64 w-64 rounded-full bg-[#d9ecff]/55 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(233,244,255,0.72)_100%)]" />

      <div className="relative grid gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
        <div className="max-w-xl">
          <h1 className="text-[2.5rem] font-black leading-[1.06] text-white sm:text-[3.4rem]">
            feedback4U: The AI
            <br />
            Builder Support Platform.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-white/92 sm:text-[1.35rem] sm:leading-9">
            Accelerate your AI development with verified feedback and robust infrastructure.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="brand-button px-7 py-3.5 text-sm font-black">
              Register Service
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center rounded-full border border-[#3b84d5] bg-white/82 px-7 py-3.5 text-sm font-black text-[#1d79d8] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
            >
              Explore Services
            </Link>
          </div>
        </div>

        <div className="relative mx-auto flex h-[320px] w-full max-w-[430px] items-center justify-center sm:h-[360px]">
          <div className="absolute inset-0 rounded-[34px] bg-white/14 blur-3xl" />

          <div className="relative z-10 flex w-[220px] flex-col gap-4 sm:w-[236px]">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={`animate-drift rounded-[26px] border border-white/50 bg-white/88 p-4 text-slate-900 shadow-[0_22px_50px_-32px_rgba(23,68,129,0.46)] ${
                  index === 1 ? "translate-x-4" : index === 2 ? "-translate-x-2" : ""
                }`}
                style={{ animationDelay: `${index * 0.35}s` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#7fb5ff]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#b5d6ff]" />
                  </div>
                  <Server className="h-5 w-5 text-[#1d79d8]" />
                </div>
                <div className="h-2 rounded-full bg-[#dcecff]" />
                <div className="mt-2 h-2 w-4/5 rounded-full bg-[#c6e0ff]" />
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="h-10 rounded-2xl bg-[#eef6ff]" />
                  <div className="h-10 rounded-2xl bg-[#edf4ff]" />
                  <div className="h-10 rounded-2xl bg-[#e6f1ff]" />
                </div>
              </div>
            ))}
          </div>

          {FLOATING_WIDGETS.map(({ icon: Icon, label, className }) => (
            <div
              key={label}
              className={`animate-float absolute rounded-[22px] border border-white/50 bg-white/92 px-4 py-3 text-slate-900 shadow-[0_18px_42px_-28px_rgba(23,68,129,0.4)] ${className}`}
            >
              <Icon className="mx-auto h-7 w-7 text-[#1d79d8]" />
              <p className="mt-2 text-center text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-10 flex items-center justify-center gap-2">
        {[0, 1, 2, 3, 4].map((dot) => (
          <span
            key={dot}
            className={`block rounded-full ${dot === 0 ? "h-3 w-8 bg-[#1d79d8]" : "h-3 w-3 bg-white/65"}`}
          />
        ))}
      </div>
    </section>
  );
}
