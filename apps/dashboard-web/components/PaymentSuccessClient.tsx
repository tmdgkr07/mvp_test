"use client";

import { useEffect, useState } from "react";

type PaymentSuccessClientProps = {
  amount: string;
  orderId: string;
  paymentKey: string;
};

type Status = "loading" | "success" | "error";

type ConfirmPaymentResponse = {
  error?: string;
  returnUrl?: string;
};

export default function PaymentSuccessClient({ amount, orderId, paymentKey }: PaymentSuccessClientProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("결제 확인을 진행하고 있습니다.");
  const [returnUrl, setReturnUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    let redirectTimeout: number | null = null;

    async function confirm() {
      try {
        const response = await fetch("/api/confirm-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount
          })
        });

        const payload = (await response.json().catch(() => ({}))) as ConfirmPaymentResponse;

        if (!response.ok) {
          throw new Error(payload.error || "결제 확인에 실패했습니다.");
        }

        if (!cancelled) {
          setReturnUrl(payload.returnUrl || "");
          setStatus("success");
          setMessage(payload.returnUrl ? "후원 접수가 완료되었습니다. 원래 페이지로 돌아갑니다." : "후원 접수가 완료되었습니다.");
          if (payload.returnUrl) {
            redirectTimeout = window.setTimeout(() => {
              window.location.replace(payload.returnUrl || "/");
            }, 1200);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "결제 확인에 실패했습니다.");
        }
      }
    }

    void confirm();

    return () => {
      cancelled = true;
      if (redirectTimeout) {
        window.clearTimeout(redirectTimeout);
      }
    };
  }, [amount, orderId, paymentKey]);

  const title =
    status === "loading" ? "결제를 확인하는 중입니다" : status === "success" ? "후원이 정상적으로 접수되었습니다" : "결제 확인에 실패했습니다";
  const toneClass = status === "error" ? "text-red-700" : status === "success" ? "text-emerald-700" : "text-gray-900";
  const meta = [orderId ? `주문 ID: ${orderId}` : "", amount ? `금액: ${Number(amount).toLocaleString("ko-KR")}원` : ""]
    .filter(Boolean)
    .join(" / ");

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-[28px] border border-emerald-100 bg-white p-8 shadow-[0_28px_70px_rgba(15,23,42,0.14)]">
        <h1 className={`text-3xl font-black ${toneClass}`}>{title}</h1>
        <p className="mt-4 text-base leading-7 text-gray-600">{message}</p>
        {meta ? <p className="mt-4 text-sm text-gray-400">{meta}</p> : null}
        {status === "success" ? (
          <div className="mt-8 flex flex-wrap gap-3">
            {returnUrl ? (
              <a href={returnUrl} className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-gray-900 transition-colors hover:bg-yellow-400">
                이전 페이지로 돌아가기
              </a>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
