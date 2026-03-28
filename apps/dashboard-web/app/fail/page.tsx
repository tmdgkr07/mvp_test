import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "결제 실패 | feedback4U",
  description: "후원 결제 실패 또는 취소 결과를 보여줍니다."
};

type FailPageProps = {
  searchParams: Promise<{
    code?: string;
    message?: string;
    orderId?: string;
  }>;
};

export default async function FailPage({ searchParams }: FailPageProps) {
  const { code = "", message = "체크아웃이 완료되지 않았습니다.", orderId = "" } = await searchParams;
  const meta = [code ? `코드: ${code}` : "", orderId ? `주문 ID: ${orderId}` : ""].filter(Boolean).join(" / ");

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-[28px] border border-red-100 bg-white p-8 shadow-[0_28px_70px_rgba(15,23,42,0.14)]">
        <h1 className="text-3xl font-black text-red-700">결제가 실패했거나 취소되었습니다</h1>
        <p className="mt-4 text-base leading-7 text-gray-600">{message}</p>
        {meta ? <p className="mt-4 text-sm text-gray-400">{meta}</p> : null}
        <div className="mt-8">
          <a href="/" className="rounded-full bg-gray-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-black">
            홈으로 돌아가기
          </a>
        </div>
      </section>
    </main>
  );
}
