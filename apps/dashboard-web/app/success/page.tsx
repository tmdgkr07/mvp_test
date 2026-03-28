import type { Metadata } from "next";
import PaymentSuccessClient from "@/components/PaymentSuccessClient";

export const metadata: Metadata = {
  title: "후원 완료 | 밥주세요",
  description: "후원 결제 확인 결과를 보여줍니다."
};

type SuccessPageProps = {
  searchParams: Promise<{
    amount?: string;
    orderId?: string;
    paymentKey?: string;
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { amount = "", orderId = "", paymentKey = "" } = await searchParams;

  if (!amount || !orderId || !paymentKey) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-6 py-16">
        <section className="w-full rounded-[28px] border border-red-100 bg-white p-8 shadow-[0_28px_70px_rgba(15,23,42,0.14)]">
          <h1 className="text-3xl font-black text-red-700">결제 확인 파라미터가 부족합니다</h1>
          <p className="mt-4 text-base leading-7 text-gray-600">success URL에는 paymentKey, orderId, amount 값이 모두 포함되어야 합니다.</p>
        </section>
      </main>
    );
  }

  return <PaymentSuccessClient amount={amount} orderId={orderId} paymentKey={paymentKey} />;
}
