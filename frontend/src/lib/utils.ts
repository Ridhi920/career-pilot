import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-signal";
  if (score >= 60) return "text-caution";
  return "text-alert";
}

export function getScoreBg(score: number): string {
  if (score >= 80) return "bg-signal";
  if (score >= 60) return "bg-caution";
  return "bg-alert";
}

/* mission stage → telemetry lamp colors */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Saved: "border border-border bg-secondary text-muted-foreground",
    Applied: "border border-data/50 bg-data/10 text-data",
    Interview: "border border-caution/50 bg-caution/10 text-caution",
    Rejected: "border border-alert/50 bg-alert/10 text-alert",
    Offer: "border border-signal/50 bg-signal/10 text-signal",
  };
  return colors[status] || "border border-border bg-secondary text-muted-foreground";
}
