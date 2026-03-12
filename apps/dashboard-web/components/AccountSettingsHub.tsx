"use client";

import { useSession } from "next-auth/react";
import { BadgeCheck, Link2, Mail, PencilLine, ShieldCheck, UserRound } from "lucide-react";

const accountItems = [
  {
    title: "별명 관리",
    description: "서비스 내 표시 이름과 공개용 별명을 관리합니다.",
    icon: <PencilLine className="h-5 w-5" />,
    status: "준비 중"
  },
  {
    title: "이메일 정보",
    description: "로그인에 연결된 기본 이메일과 알림 수신 주소를 확인합니다.",
    icon: <Mail className="h-5 w-5" />,
    status: "읽기 가능"
  },
  {
    title: "계정 연동",
    description: "Google 계정 외 추가 로그인 수단과 외부 계정 연결 구조를 확장합니다.",
    icon: <Link2 className="h-5 w-5" />,
    status: "연동 예정"
  },
  {
    title: "보안 설정",
    description: "세션, 로그인 이력, 추가 인증 수단 관리 영역으로 확장할 수 있습니다.",
    icon: <ShieldCheck className="h-5 w-5" />,
    status: "확장 예정"
  }
];

export default function AccountSettingsHub() {
  const { data: session } = useSession();
  const displayName = session?.user?.name ?? "메이커";
  const email = session?.user?.email ?? "이메일 정보 없음";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="rounded-3xl border border-[#EBEBEB] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#B79A18]">Account Settings</p>
            <h2 className="mt-2 text-2xl font-black text-gray-900">개인정보 관리</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              별명, 계정 연동, 이메일, 보안 설정을 한 곳에서 관리하는 영역입니다.
            </p>
          </div>

          <div className="rounded-2xl border border-[#EEE5BC] bg-[#FFFDF2] px-5 py-4 shadow-[0_12px_28px_rgba(33,33,33,0.05)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFE784] text-[#6B5300]">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">{email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {accountItems.map((item) => (
            <section key={item.title} className="rounded-2xl border border-[#EBEBEB] bg-[#FCFCFC] p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF3B3] text-[#6B5300]">
                  {item.icon}
                </div>
                <span className="rounded-full bg-[#FFF6CC] px-3 py-1 text-xs font-bold text-[#7A6200]">
                  {item.status}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-black text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">{item.description}</p>
            </section>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-[#E5D27A] bg-[#FFFBE8] px-5 py-4">
          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 h-5 w-5 text-[#8B6B00]" />
            <p className="text-sm leading-6 text-gray-600">
              현재는 구조와 진입 메뉴를 먼저 열어둔 상태입니다. 다음 단계에서 별명 수정, 계정 연결 관리, 보안 설정 저장 기능을 순서대로 붙일 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
