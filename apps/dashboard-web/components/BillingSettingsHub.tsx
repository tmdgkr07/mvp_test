"use client";

import { BadgeDollarSign, CreditCard, Landmark, ReceiptText, WalletCards } from "lucide-react";

const billingItems = [
  {
    title: "기본 결제 수단",
    description: "카드, 계좌, 간편결제 등 기본 수단을 연결하는 영역입니다.",
    icon: <CreditCard className="h-5 w-5" />,
    status: "연결 예정"
  },
  {
    title: "정산 계좌",
    description: "후원금 또는 수익 정산에 사용할 계좌 정보를 관리합니다.",
    icon: <Landmark className="h-5 w-5" />,
    status: "정의 필요"
  },
  {
    title: "결제 이력",
    description: "후원 결제, 취소, 정산 이력 조회 화면으로 확장할 수 있습니다.",
    icon: <ReceiptText className="h-5 w-5" />,
    status: "추가 예정"
  },
  {
    title: "지갑 및 외부 연동",
    description: "Stripe, 토스페이먼츠, 기타 결제 파트너와의 연결 상태를 보여줍니다.",
    icon: <WalletCards className="h-5 w-5" />,
    status: "연동 예정"
  }
];

export default function BillingSettingsHub() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="rounded-3xl border border-[#EBEBEB] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#B79A18]">Billing Settings</p>
            <h2 className="mt-2 text-2xl font-black text-gray-900">결제 수단 관리</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              후원 및 정산에 필요한 결제 수단, 계좌, 외부 결제 파트너 연결을 관리하는 메뉴입니다.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-2xl border border-[#EEE5BC] bg-[#FFFDF2] px-5 py-4 shadow-[0_12px_28px_rgba(33,33,33,0.05)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFE784] text-[#6B5300]">
              <BadgeDollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">결제 설정 준비 중</p>
              <p className="text-xs text-gray-500">연결할 수단과 정산 정책을 이곳에서 관리합니다.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {billingItems.map((item) => (
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
      </div>
    </div>
  );
}
