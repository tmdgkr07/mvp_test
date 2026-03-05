import type { Metadata } from "next";
import BuilderDashboard from "@/components/BuilderDashboard";

export const metadata: Metadata = {
  title: "빌더 대시보드",
  description: "프로젝트별 유입/전환/피드백 데이터를 확인하세요."
};

export default function DashboardPage() {
  return <BuilderDashboard />;
}
