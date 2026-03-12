"use client";

import { useEffect } from "react";

type LocalCheckoutClientProps = {
  amount: string;
  autoApprove: boolean;
  orderId: string;
  projectId: string;
};

export default function LocalCheckoutClient({ amount, autoApprove, orderId, projectId }: LocalCheckoutClientProps) {
  const paymentKey = `local_pay_${Date.now()}`;
  const approveHref = `/success?paymentKey=${encodeURIComponent(paymentKey)}&orderId=${encodeURIComponent(orderId)}&amount=${encodeURIComponent(amount)}`;
  const cancelHref = `/fail?code=${encodeURIComponent("LOCAL_CANCEL")}&message=${encodeURIComponent("로컬 체크아웃이 취소되었습니다.")}&orderId=${encodeURIComponent(orderId)}`;

  useEffect(() => {
    if (!autoApprove) {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.location.replace(approveHref);
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [approveHref, autoApprove]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-[28px] bg-white p-8 shadow-[0_28px_70px_rgba(15,23,42,0.14)]">
        <h1 className="text-3xl font-black text-gray-900">로컬 테스트 체크아웃</h1>
        <p className="mt-4 text-base leading-7 text-gray-600">
          이 페이지는 로컬 개발 중 결제 흐름을 확인하기 위한 테스트 화면입니다. 실제 결제가 처리되지는 않습니다.
        </p>
        <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
          <p>프로젝트 ID: {projectId}</p>
          <p>주문 ID: {orderId}</p>
          <p>금액: {Number(amount).toLocaleString("ko-KR")}원</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={approveHref} className="rounded-full bg-gray-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-black">
            테스트 결제 승인
          </a>
          <a href={cancelHref} className="rounded-full bg-gray-200 px-5 py-3 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-300">
            취소
          </a>
        </div>
      </section>
    </main>
  );
}
