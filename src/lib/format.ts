export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactINR(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
}

export const STAGE_LABELS: Record<string, string> = {
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  PRESALES: "Technical Eval",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export const STAGE_ORDER = [
  "QUALIFIED",
  "PROPOSAL",
  "PRESALES",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export const SERVICE_LINE_LABELS: Record<string, string> = {
  VAPT: "VAPT",
  SOC: "SOC",
  GRC_COMPLIANCE: "GRC / Compliance",
  ADVISORY: "Advisory",
  MANAGED_SECURITY: "Managed Security",
  OTHER: "Other",
};

export const LOST_REASON_LABELS: Record<string, string> = {
  PRICE: "Price",
  COMPETITOR: "Lost to competitor",
  TIMING: "Bad timing",
  NO_BUDGET: "No budget",
  LOST_TO_INHOUSE: "Lost to in-house",
  OTHER: "Other",
};

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  INBOUND: "Inbound",
  OUTBOUND: "Outbound",
  REFERRAL: "Referral",
  EVENT: "Event",
  PARTNER: "Partner",
  OTHER: "Other",
};

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  CALL: "Call",
  MEETING: "Meeting",
  EMAIL: "Email",
  PROPOSAL_SENT: "Proposal sent",
  FOLLOW_UP: "Follow-up",
  NOTE: "Note",
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function monthLabel(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} '${String(year).slice(2)}`;
}
