import type { Metadata } from "next";
import BuilderDashboard from "@/components/BuilderDashboard";

export const metadata: Metadata = {
  title: "마이페이지 | 밥주세요",
  description: "내 MVP 목록과 유입/전환/피드백 데이터를 확인하세요."
};

export default function DashboardPage() {
  return <BuilderDashboard />;
}
