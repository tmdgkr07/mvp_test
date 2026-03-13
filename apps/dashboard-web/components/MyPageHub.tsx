"use client";

import { Blocks, CreditCard, LayoutDashboard, ShieldCheck, UserCog } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import AccountSettingsHub from "@/components/AccountSettingsHub";
import BillingSettingsHub from "@/components/BillingSettingsHub";
import BuilderDashboard, { type BuilderDashboardTab } from "@/components/BuilderDashboard";
import ServiceHub from "@/components/ServiceHub";
import type { BuilderDashboardBootstrapData } from "@/lib/platform-hub";
import type { ServiceHubBootstrapData } from "@/lib/service-hub";

export type HubKey = "platform" | "service" | "account" | "billing";
export type WorkspaceRole = "creator" | "admin";

type MyPageHubProps = {
  initialHub?: HubKey;
  initialProjectId?: string;
  initialPlatformTab?: BuilderDashboardTab;
  showAdminLink?: boolean;
  userRole?: WorkspaceRole;
  platformHubInitialData?: BuilderDashboardBootstrapData | null;
  serviceHubInitialData?: ServiceHubBootstrapData | null;
};

const primaryHubItems: Array<{
  key: Extract<HubKey, "platform" | "service">;
  title: string;
  icon: React.ReactNode;
}> = [
  {
    key: "platform",
    title: "플랫폼 허브",
    icon: <LayoutDashboard className="h-4 w-4" />
  },
  {
    key: "service",
    title: "서비스 허브",
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
    title: "계정 설정",
    icon: <UserCog className="h-4 w-4" />,
    className: "border-[#CFE2FF] bg-[#F3F8FF] text-[#2F5EA8] hover:border-[#AFCBFF]"
  },
  {
    key: "billing",
    title: "결제 설정",
    icon: <CreditCard className="h-4 w-4" />,
    className: "border-[#D8ECCC] bg-[#F5FBF0] text-[#4E7A33] hover:border-[#BCDCA8]"
  }
];

export default function MyPageHub({
  initialHub = "platform",
  initialProjectId,
  initialPlatformTab = "overview",
  showAdminLink = false,
  userRole = "creator",
  platformHubInitialData = null,
  serviceHubInitialData = null
}: MyPageHubProps) {
  const [activeHub, setActiveHub] = useState<HubKey>(initialHub);
  const isAdmin = userRole === "admin";

  useEffect(() => {
    setActiveHub(initialHub);
  }, [initialHub]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.pathname = "/dashboard";

    if (activeHub === "platform") {
      url.searchParams.delete("hub");
    } else {
      url.search = "";
      url.searchParams.set("hub", activeHub);
    }

    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [activeHub]);

  const roleBadgeClass = isAdmin
    ? "border-[#E5D6FF] bg-[#F8F4FF] text-[#5C3C9B]"
    : "border-[#E5D27A] bg-[#FFF7CC] text-[#6B5300]";

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="border-b border-[#EBEBEB] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-900">워크스페이스</h1>
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${roleBadgeClass}`}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {isAdmin ? "관리자" : "제작자"}
                </span>
              </div>

              <Link
                href="/"
                className="group inline-flex items-center gap-2 rounded-full border border-[#EEE5BC] bg-[#FFFDF2] px-4 py-2 text-sm font-black text-gray-900 transition-all hover:-translate-y-0.5 hover:border-[#E5D27A]"
              >
                <span className="text-xl transition-transform duration-300 group-hover:rotate-12">🍚</span>
                <span>밥주세요 홈</span>
              </Link>

              {showAdminLink ? (
                <Link
                  href={"/admin" as Route}
                  className="inline-flex items-center gap-2 rounded-full border border-[#E5D6FF] bg-[#F8F4FF] px-4 py-2 text-sm font-black text-[#5C3C9B] transition-all hover:-translate-y-0.5 hover:border-[#CFB7FF]"
                >
                  관리자 콘솔
                </Link>
              ) : null}

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

          <div className="flex flex-wrap gap-3">
            {primaryHubItems.map((item) => {
              const isActive = activeHub === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveHub(item.key)}
                  className={`min-w-[220px] rounded-2xl border px-4 py-4 text-left transition-all ${
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
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeHub === "platform" ? (
        <BuilderDashboard
          initialData={platformHubInitialData}
          initialSelectedProjectId={initialProjectId}
          initialTab={initialPlatformTab}
        />
      ) : null}
      {activeHub === "service" ? <ServiceHub initialData={serviceHubInitialData} /> : null}
      {activeHub === "account" ? <AccountSettingsHub /> : null}
      {activeHub === "billing" ? <BillingSettingsHub /> : null}
    </div>
  );
}
