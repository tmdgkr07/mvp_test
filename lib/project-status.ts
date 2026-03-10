export type ProjectStatus =
  | "IDEA"
  | "VALIDATING"
  | "DEVELOPING"
  | "RELEASED"
  | "GROWING"
  | "PAUSED"
  | "PIVOTED";

export type DisplayProjectStatus = "IDEA" | "DEVELOPING" | "RELEASED" | "PAUSED" | "PIVOTED";
export type ProjectStatusTone = "idea" | "developing" | "released" | "paused" | "pivoted";

export const PROJECT_STATUS_OPTIONS: Array<{ value: DisplayProjectStatus; label: string }> = [
  { value: "IDEA", label: "\uC544\uC774\uB514\uC5B4" },
  { value: "DEVELOPING", label: "\uAC1C\uBC1C\uC911" },
  { value: "RELEASED", label: "\uACF5\uC2DD \uBC30\uD3EC\uC911" },
  { value: "PAUSED", label: "\uC77C\uC2DC \uC911\uB2E8" },
  { value: "PIVOTED", label: "\uC6B4\uC601 \uC911\uB2E8(\uD53C\uBCF4\uD305)" }
];

export function getProjectStatusMeta(status: ProjectStatus) {
  switch (status) {
    case "IDEA":
    case "VALIDATING":
      return { label: "\uC544\uC774\uB514\uC5B4", tone: "idea" as const };
    case "DEVELOPING":
      return { label: "\uAC1C\uBC1C\uC911", tone: "developing" as const };
    case "RELEASED":
    case "GROWING":
      return { label: "\uACF5\uC2DD \uBC30\uD3EC\uC911", tone: "released" as const };
    case "PAUSED":
      return { label: "\uC77C\uC2DC \uC911\uB2E8", tone: "paused" as const };
    case "PIVOTED":
      return { label: "\uC6B4\uC601 \uC911\uB2E8(\uD53C\uBCF4\uD305)", tone: "pivoted" as const };
  }
}

export function getDisplayStatusValue(status: ProjectStatus): DisplayProjectStatus {
  switch (status) {
    case "VALIDATING":
      return "IDEA";
    case "GROWING":
      return "RELEASED";
    default:
      return status;
  }
}

export function isOfficiallyLaunched(status: ProjectStatus) {
  return status === "RELEASED" || status === "GROWING";
}

export function matchesDisplayStatusFilter(status: ProjectStatus, filter: string) {
  if (filter === "ALL") return true;
  return getDisplayStatusValue(status) === filter;
}
