"use client";

import { Blocks, CreditCard, LayoutDashboard, UserCog } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AccountSettingsHub from "@/components/AccountSettingsHub";
import BillingSettingsHub from "@/components/BillingSettingsHub";
import BuilderDashboard from "@/components/BuilderDashboard";
import ServiceHub from "@/components/ServiceHub";

type HubKey = "platform" | "service" | "account" | "billing";

const primaryHubItems: Array<{
  key: Extract<HubKey, "platform" | "service">;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    key: "platform",
    title: "플랫폼 허브",
    description: "플랫폼 내부에서 수집되는 유입, 반응, 피드백 데이터를 관리합니다.",
    icon: <LayoutDashboard className="h-4 w-4" />
  },
  {
    key: "service",
    title: "서비스 허브",
    description: "배포한 외부 서비스의 임베드와 외부 지표 연동 현황을 관리합니다.",
    icon: <Blocks className="h-4 w-4" />
  }
];

const utilityHubItems: Array<{
  key: Extract<HubKey, "account" | "billing">;
  title: string;
  icon: React.ReactNode;
  className: string;
}> = [
  {
    key: "account",
    title: "개인정보 관리",
    icon: <UserCog className="h-4 w-4" />,
    className: "border-[#CFE2FF] bg-[#F3F8FF] text-[#2F5EA8] hover:border-[#AFCBFF]"
  },
  {
    key: "billing",
    title: "결제 수단 관리",
    icon: <CreditCard className="h-4 w-4" />,
    className: "border-[#D8ECCC] bg-[#F5FBF0] text-[#4E7A33] hover:border-[#BCDCA8]"
  }
];

export default function MyPageHub() {
  const searchParams = useSearchParams();
  const [activeHub, setActiveHub] = useState<HubKey>("platform");

  useEffect(() => {
    const hub = searchParams.get("hub");
    if (hub === "platform" || hub === "service" || hub === "account" || hub === "billing") {
      setActiveHub(hub);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="border-b border-[#EBEBEB] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-gray-900">마이페이지</h1>
              <Link
                href="/"
                className="group inline-flex items-center gap-2 rounded-full border border-[#EEE5BC] bg-[#FFFDF2] px-4 py-2 text-sm font-black text-gray-900 transition-all hover:-translate-y-0.5 hover:border-[#E5D27A]"
              >
                <span className="text-xl transition-transform duration-300 group-hover:rotate-12">🍚</span>
                <span>밥주세요 홈</span>
              </Link>

              {utilityHubItems.map((item) => {
                const isActive = activeHub === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveHub(item.key)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all hover:-translate-y-0.5 ${
                      item.className
                    } ${isActive ? "shadow-[0_10px_24px_rgba(33,33,33,0.08)]" : ""}`}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B79A18]">My Page Hub</p>

          <div className="flex flex-wrap gap-3">
            {primaryHubItems.map((item) => {
              const isActive = activeHub === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveHub(item.key)}
                  className={`min-w-[280px] rounded-2xl border px-4 py-4 text-left transition-all ${
                    isActive
                      ? "border-[#E5D27A] bg-[#FFF6CC] shadow-[0_16px_30px_rgba(214,181,29,0.14)]"
                      : "border-[#EBEBEB] bg-white hover:border-[#E5D27A] hover:bg-[#FFFDF2]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isActive ? "bg-[#FFE784] text-[#6B5300]" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-500">{item.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeHub === "platform" ? <BuilderDashboard /> : null}
      {activeHub === "service" ? <ServiceHub /> : null}
      {activeHub === "account" ? <AccountSettingsHub /> : null}
      {activeHub === "billing" ? <BillingSettingsHub /> : null}
    </div>
  );
}
