import type { Metadata } from "next";
import LocalCheckoutClient from "@/components/LocalCheckoutClient";

export const metadata: Metadata = {
  title: "로컬 체크아웃 | feedback4U",
  description: "로컬 테스트용 결제 시뮬레이터입니다."
};

type LocalCheckoutPageProps = {
  searchParams: Promise<{
    amount?: string;
    auto?: string;
    orderId?: string;
    projectId?: string;
  }>;
};

export default async function LocalCheckoutPage({ searchParams }: LocalCheckoutPageProps) {
  const { amount = "", auto = "", orderId = "", projectId = "" } = await searchParams;

  return <LocalCheckoutClient amount={amount} autoApprove={auto === "1"} orderId={orderId} projectId={projectId} />;
}
