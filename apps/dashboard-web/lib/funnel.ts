import type { FunnelStage } from "@/lib/types";

export type FunnelStageMeta = {
  key: FunnelStage;
  label: string;
  shortLabel: string;
  description: string;
  helper: string;
};

export const FUNNEL_STAGE_ORDER: FunnelStage[] = [
  "main_exposure",
  "website_click",
  "support_click",
  "feedback_submit"
];

export const FUNNEL_STAGE_META: Record<FunnelStage, FunnelStageMeta> = {
  main_exposure: {
    key: "main_exposure",
    label: "내 프로젝트 노출",
    shortLabel: "프로젝트 노출",
    description: "feedback4U 홈 또는 탐색 화면에서 서비스 카드가 사용자 화면에 표시된 횟수입니다.",
    helper: "퍼널의 시작점으로, 우리 플랫폼 안에서 서비스가 얼마나 노출됐는지 보여줍니다."
  },
  website_click: {
    key: "website_click",
    label: "서비스 웹사이트 클릭",
    shortLabel: "웹사이트 클릭",
    description: "사용자가 카드의 '방문하기' 버튼을 눌러 실제 서비스 웹사이트로 이동한 횟수입니다.",
    helper: "노출 이후 실제 관심이 생겨 외부 서비스까지 이동했는지 확인하는 단계입니다."
  },
  support_click: {
    key: "support_click",
    label: "후원 버튼 클릭",
    shortLabel: "후원 클릭",
    description: "사용자가 밥알 후원 버튼을 눌러 결제 또는 후원 페이지로 이동을 시도한 횟수입니다.",
    helper: "관심을 넘어 행동 의사가 생겼는지 판단할 수 있는 핵심 전환 단계입니다."
  },
  feedback_submit: {
    key: "feedback_submit",
    label: "피드백 제출",
    shortLabel: "피드백 제출",
    description: "후원 이후 남긴 코멘트가 실제로 저장된 횟수입니다.",
    helper: "정성 피드백까지 남긴 사용자 수로, 가장 깊은 참여도를 보여줍니다."
  }
};

export function getFunnelStageMeta(stage: FunnelStage) {
  return FUNNEL_STAGE_META[stage];
}
