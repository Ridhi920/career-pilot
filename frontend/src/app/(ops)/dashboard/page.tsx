"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api, applicationsApi, resumeApi } from "@/lib/api";
import {
  Panel,
  PanelHeader,
  Lamp,
  StatReadout,
  ScannerGauge,
  NoSignal,
  scoreColor,
} from "@/components/ops/primitives";
import { cn, formatDate } from "@/lib/utils";
import type { Application, ApplicationMetrics, ResumeListItem } from "@/types";

/* ============================================================
   PIPELINE — one bar per stage, count on the right.
   ============================================================ */
function Pipeline({ metrics }: { metrics?: ApplicationMetrics }) {
  const stages = [
    { label: "Saved", value: metrics?.saved ?? 0, color: "hsl(var(--muted-foreground))" },
    { label: "Applied", value: metrics?.applied ?? 0, color: "hsl(var(--data))" },
    { label: "Interview", value: metrics?.interviews ?? 0, color: "hsl(var(--caution))" },
    { label: "Offer", value: metrics?.offers ?? 0, color: "hsl(var(--signal))" },
    { label: "Rejected", value: metrics?.rejected ?? 0, color: "hsl(var(--alert) / 0.7)" },
  ];
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="space-y-5">
      {stages.map((s) => (
        <div key={s.label}>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[0.78rem] text-foreground/90">{s.label}</span>
            <span className="font-mono text-sm tabular-nums" style={{ color: s.color }}>
              {s.value}
            </span>
          </div>
          <div className="h-2 bg-border/50">
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${(s.value / max) * 100}%`, background: s.color }}
            />
          </div>
        </div>
      ))}
      <Link
        href="/applications"
        className="inline-block text-[0.74rem] font-medium text-signal hover:underline"
      >
        View all applications →
      </Link>
    </div>
  );
}

/* ============================================================
   Suggested next steps — computed from real data
   ============================================================ */
function useNextSteps() {
  const { data: resumes } = useQuery<ResumeListItem[]>({
    queryKey: ["resumes"],
    queryFn: () => resumeApi.list().then((r) => r.data),
  });
  const { data: metrics } = useQuery<ApplicationMetrics>({
    queryKey: ["metrics"],
    queryFn: () => applicationsApi.metrics().then((r) => r.data),
  });
  const { data: jobs } = useQuery<any[]>({
    queryKey: ["jobs", "all"],
    queryFn: () => api.get("/api/jobs").then((r) => r.data),
  });

  const steps: { text: string; href: string; lamp: string; cta: string }[] = [];
  const latestAts = resumes?.find((r) => r.ats_analysis)?.ats_analysis?.score;

  if (resumes && resumes.length === 0) {
    steps.push({
      text: "You haven't uploaded a resume yet. Upload one to get your ATS score.",
      href: "/resume",
      lamp: "text-alert",
      cta: "Upload resume",
    });
  } else if (latestAts != null && latestAts < 70) {
    steps.push({
      text: `Your resume scores ${Math.round(latestAts)}/100. Generate an optimized version to improve it.`,
      href: "/resume",
      lamp: "text-caution",
      cta: "Improve resume",
    });
  }

  const unscored = (jobs ?? []).filter((j) => j.status === "Discovered").length;
  if (unscored > 0) {
    steps.push({
      text: `${unscored} found job${unscored === 1 ? "" : "s"} ${unscored === 1 ? "hasn't" : "haven't"} been matched against your resume yet.`,
      href: "/jobs",
      lamp: "text-data",
      cta: "Score jobs",
    });
  }

  if ((metrics?.interviews ?? 0) > 0) {
    steps.push({
      text: `You have ${metrics!.interviews} interview${metrics!.interviews === 1 ? "" : "s"} coming up. Practice with AI feedback.`,
      href: "/interview",
      lamp: "text-caution",
      cta: "Practice interview",
    });
  }

  if (metrics && metrics.total === 0) {
    steps.push({
      text: "You're not tracking any applications yet. Search for jobs to get started.",
      href: "/jobs",
      lamp: "text-data",
      cta: "Find jobs",
    });
  }

  if (steps.length === 0) {
    steps.push({
      text: "Everything looks good. Search for new jobs — fresh listings appear daily.",
      href: "/jobs",
      lamp: "text-signal",
      cta: "Find jobs",
    });
  }

  return { steps: steps.slice(0, 3), latestAts, metrics, resumes };
}

/* ============================================================
   PAGE
   ============================================================ */
export default function DashboardPage() {
  const { steps, latestAts, metrics } = useNextSteps();

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["applications"],
    queryFn: () => applicationsApi.list().then((r) => r.data),
  });

  const recent = applications.slice(0, 5);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="px-4 lg:px-6 py-8">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[0.72rem] text-muted-foreground mb-2">{today}</p>
          <h1 className="font-display text-2xl md:text-3xl font-medium tracking-wide uppercase">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <StatReadout label="APPLICATIONS" value={metrics?.total ?? 0} />
          <StatReadout label="SUCCESS RATE" value={metrics?.success_rate ?? 0} suffix="%" color="text-data" />
        </div>
      </div>
      <div className="axis mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* next steps */}
        <div className="lg:col-span-3 space-y-5">
          <Panel hud>
            <PanelHeader label="SUGGESTED NEXT STEPS" />
            <div className="p-4 space-y-3">
              {steps.map((d, i) => (
                <motion.div
                  key={d.text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="border border-border/70 bg-background/40 p-3.5"
                >
                  <div className="flex items-start gap-2.5">
                    <Lamp color={d.lamp} pulse className="mt-1" />
                    <p className="text-[0.8rem] leading-relaxed text-foreground/90">{d.text}</p>
                  </div>
                  <Link
                    href={d.href}
                    className="inline-flex items-center gap-1.5 mt-3 text-[0.72rem] font-medium text-signal hover:glow-text transition-all"
                  >
                    {d.cta} →
                  </Link>
                </motion.div>
              ))}
            </div>
          </Panel>

          {/* resume score */}
          <Panel>
            <PanelHeader label="RESUME SCORE" />
            <div className="p-4 flex items-center justify-center">
              {latestAts != null ? (
                <ScannerGauge score={Math.round(latestAts)} size={150} label="ATS SCORE" sublabel="latest resume" />
              ) : (
                <NoSignal message="No resume has been scored yet." className="py-8">
                  <Link href="/resume" className="text-[0.72rem] font-medium text-signal">
                    Upload a resume →
                  </Link>
                </NoSignal>
              )}
            </div>
          </Panel>
        </div>

        {/* pipeline */}
        <div className="lg:col-span-6">
          <Panel className="h-full">
            <PanelHeader label="APPLICATION PIPELINE" />
            <div className="p-5">
              {applications.length === 0 ? (
                <NoSignal message="No applications yet. Once you start tracking them, you'll see how many are at each stage here.">
                  <Link href="/applications" className="text-[0.72rem] font-medium text-signal">
                    Add your first application →
                  </Link>
                </NoSignal>
              ) : (
                <Pipeline metrics={metrics} />
              )}
            </div>
          </Panel>
        </div>

        {/* recent column */}
        <div className="lg:col-span-3 space-y-5">
          <Panel>
            <PanelHeader label="RECENT APPLICATIONS" />
            <div className="divide-y divide-border/60">
              {recent.length === 0 ? (
                <NoSignal message="Nothing here yet." className="py-8" />
              ) : (
                recent.map((app, i) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="px-4 py-3 flex items-center gap-3"
                  >
                    <Lamp
                      color={
                        app.status === "Offer" ? "text-signal"
                        : app.status === "Interview" ? "text-caution"
                        : app.status === "Applied" ? "text-data"
                        : app.status === "Rejected" ? "text-alert"
                        : "text-muted-foreground"
                      }
                      className="w-[5px] h-[5px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.76rem] truncate">{app.job_title}</p>
                      <p className="text-[0.64rem] text-muted-foreground truncate">
                        {app.company} · {formatDate(app.created_at)}
                      </p>
                    </div>
                    {app.ats_score != null && (
                      <span className={cn("font-mono text-[0.66rem] tabular-nums", scoreColor(app.ats_score))}>
                        {app.ats_score}
                      </span>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* quick actions */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-px bg-border/60 border border-border/60">
        {[
          { href: "/resume", label: "Check resume", desc: "Upload & improve your ATS score" },
          { href: "/jobs", label: "Find jobs", desc: "Search and match openings" },
          { href: "/applications", label: "Track applications", desc: "See where everything stands" },
          { href: "/interview", label: "Practice interview", desc: "Get AI feedback on answers" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group bg-card/80 px-5 py-4 flex items-center justify-between transition-colors duration-200 hover:bg-accent/60"
          >
            <div>
              <p className="font-display text-[0.78rem] tracking-[0.14em] uppercase group-hover:text-signal transition-colors">
                {item.label}
              </p>
              <p className="text-[0.68rem] text-muted-foreground mt-1">{item.desc}</p>
            </div>
            <span className="font-mono text-muted-foreground/50 transition-all duration-300 group-hover:text-signal group-hover:translate-x-1">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
