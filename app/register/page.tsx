import type { Metadata } from "next";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "MVP 등록",
  description: "프로젝트 URL과 후원 URL을 입력해 MVP를 등록하세요."
};

export default function RegisterPage() {
  return <RegisterForm />;
}
