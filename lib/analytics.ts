import type { AnalyticsEvent, Feedback, FunnelStage } from "@/lib/types";

const STAGE_LABEL: Record<FunnelStage, string> = {
  main_exposure: "메인 노출",
  website_click: "웹사이트 클릭",
  support_click: "후원 버튼 클릭",
  feedback_submit: "피드백 제출"
};

function percentage(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function getDurationMs(event: AnalyticsEvent): number {
  const raw = event.metadata?.durationMs;
  return typeof raw === "number" ? raw : 0;
}

function getSupportAmount(event: AnalyticsEvent): number {
  const raw = event.metadata?.amount;
  return typeof raw === "number" ? raw : 0;
}

function getSupportTier(event: AnalyticsEvent): "starter" | "supporter" | "angel" | "unknown" {
  const raw = event.metadata?.tier;
  if (raw === "starter" || raw === "supporter" || raw === "angel") {
    return raw;
  }
  return "unknown";
}

function getLastStage(event: AnalyticsEvent): FunnelStage {
  const raw = event.metadata?.lastStage;
  if (raw === "main_exposure" || raw === "website_click" || raw === "support_click" || raw === "feedback_submit") {
    return raw;
  }
  return "main_exposure";
}

export function detectSentiment(comment: string): Feedback["sentiment"] {
  const lower = comment.toLowerCase();
  const positive = ["좋아요", "최고", "유용", "great", "good", "awesome", "love"];
  const negative = ["별로", "불편", "아쉬워", "bad", "poor", "terrible", "hate"];

  if (positive.some((k) => lower.includes(k))) return "positive";
  if (negative.some((k) => lower.includes(k))) return "negative";
  return "neutral";
}

export function buildDashboard(events: AnalyticsEvent[], feedback: Feedback[]) {
  const exposure = events.filter((e) => e.type === "project_impression").length;
  const websiteClick = events.filter((e) => e.type === "website_click").length;
  const supportEvents = events.filter((e) => e.type === "support_button_click");
  const supportClick = supportEvents.length;
  const feedbackSubmit = events.filter((e) => e.type === "feedback_submit").length;

  const funnel = [
    { stage: STAGE_LABEL.main_exposure, key: "main_exposure", count: exposure },
    { stage: STAGE_LABEL.website_click, key: "website_click", count: websiteClick },
    { stage: STAGE_LABEL.support_click, key: "support_click", count: supportClick },
    { stage: STAGE_LABEL.feedback_submit, key: "feedback_submit", count: feedbackSubmit }
  ];

  const dropOff = [
    {
      from: STAGE_LABEL.main_exposure,
      to: STAGE_LABEL.website_click,
      lostUsers: Math.max(exposure - websiteClick, 0),
      rate: percentage(Math.max(exposure - websiteClick, 0), exposure)
    },
    {
      from: STAGE_LABEL.website_click,
      to: STAGE_LABEL.support_click,
      lostUsers: Math.max(websiteClick - supportClick, 0),
      rate: percentage(Math.max(websiteClick - supportClick, 0), websiteClick)
    },
    {
      from: STAGE_LABEL.support_click,
      to: STAGE_LABEL.feedback_submit,
      lostUsers: Math.max(supportClick - feedbackSubmit, 0),
      rate: percentage(Math.max(supportClick - feedbackSubmit, 0), supportClick)
    }
  ];

  const sessionEnds = events.filter((e) => e.type === "session_end");
  const exitsByStage: Record<FunnelStage, number> = {
    main_exposure: 0,
    website_click: 0,
    support_click: 0,
    feedback_submit: 0
  };

  for (const event of sessionEnds) {
    exitsByStage[getLastStage(event)] += 1;
  }

  const totalExits = sessionEnds.length;
  const exitReport = (Object.keys(exitsByStage) as FunnelStage[]).map((stage) => ({
    stage: STAGE_LABEL[stage],
    exits: exitsByStage[stage],
    rate: percentage(exitsByStage[stage], totalExits)
  }));

  const totalDurationMs = sessionEnds.reduce((sum, event) => sum + getDurationMs(event), 0);
  const avgSessionSeconds = sessionEnds.length ? Math.round(totalDurationMs / sessionEnds.length / 1000) : 0;
  const estimatedAmount = supportEvents.reduce((sum, event) => sum + getSupportAmount(event), 0);
  const totalRice = Math.round(estimatedAmount / 1000);
  const tierLabels: Record<ReturnType<typeof getSupportTier>, string> = {
    starter: "5 밥알",
    supporter: "10 밥알",
    angel: "30 밥알",
    unknown: "기타"
  };
  const tierBreakdown = Object.entries(
    supportEvents.reduce<Record<string, { count: number; amount: number }>>((acc, event) => {
      const tier = getSupportTier(event);
      const amount = getSupportAmount(event);
      const current = acc[tier] ?? { count: 0, amount: 0 };
      acc[tier] = {
        count: current.count + 1,
        amount: current.amount + amount
      };
      return acc;
    }, {})
  ).map(([tier, summary]) => ({
    tier,
    label: tierLabels[tier as keyof typeof tierLabels] ?? "기타",
    count: summary.count,
    amount: summary.amount,
    rice: Math.round(summary.amount / 1000)
  }));

  return {
    funnel,
    dropOff,
    exitReport,
    avgSessionSeconds,
    totalSessions: sessionEnds.length,
    feedback,
    supportSummary: {
      supportClickCount: supportClick,
      estimatedAmount,
      totalRice,
      tierBreakdown
    }
  };
}
