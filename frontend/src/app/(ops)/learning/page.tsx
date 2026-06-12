"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { learningApi } from "@/lib/api";
import { ModuleHeader } from "@/components/ops/ModuleHeader";
import { Panel, PanelHeader, Lamp, NoSignal } from "@/components/ops/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { LearningPlan, LearningPlanResponse, MarketSkillsResponse } from "@/types";

const TREND_BADGE: Record<string, { glyph: string; cls: string }> = {
  rising: { glyph: "▲ rising", cls: "text-signal" },
  stable: { glyph: "▶ stable", cls: "text-caution" },
  declining: { glyph: "▼ declining", cls: "text-alert" },
};

/* ============================================================
   MARKET RADAR — top skills demanded across discovered jobs
   ============================================================ */
function MarketRadar({ onAdopt }: { onAdopt: (skills: string[]) => void }) {
  const [result, setResult] = useState<MarketSkillsResponse | null>(null);

  const mutation = useMutation({
    mutationFn: () => learningApi.marketSkills().then((r) => r.data as MarketSkillsResponse),
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Analysed ${data.analyzed_jobs} job descriptions`);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || "Couldn't analyse the job market"),
  });

  const maxDemand = Math.max(1, ...(result?.top_skills.map((s) => s.demand) ?? [1]));

  return (
    <Panel hud className="mb-5">
      <PanelHeader
        label="MARKET RADAR"
        extra={
          result ? (
            <span className="font-mono text-[0.64rem] text-muted-foreground tabular-nums">
              {result.analyzed_jobs} postings analysed
            </span>
          ) : undefined
        }
      />
      {!result ? (
        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <p className="text-[0.76rem] text-muted-foreground leading-relaxed flex-1">
            Scan the job descriptions you&apos;ve discovered and surface the skills employers
            ask for most — including the ones your resume doesn&apos;t cover yet.
          </p>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="shrink-0">
            {mutation.isPending ? "Analysing…" : "Analyse job market"}
          </Button>
        </div>
      ) : (
        <div className="p-5 space-y-5">
          <p className="text-[0.76rem] text-muted-foreground leading-relaxed">{result.summary}</p>

          {/* demand chart */}
          <div className="space-y-3">
            {result.top_skills.map((s) => (
              <div key={s.skill}>
                <div className="flex items-center gap-3">
                  <span className="text-[0.76rem] w-40 truncate shrink-0">{s.skill}</span>
                  <div className="flex-1 h-2 bg-secondary/80 overflow-hidden rounded-sm">
                    <div
                      className={cn("h-full rounded-sm", s.in_resume ? "bg-signal/70" : "bg-data/80")}
                      style={{ width: `${(s.demand / maxDemand) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[0.64rem] text-muted-foreground tabular-nums w-14 text-right shrink-0">
                    {s.demand} job{s.demand === 1 ? "" : "s"}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[0.6rem] w-20 shrink-0",
                      TREND_BADGE[s.trend]?.cls ?? "text-muted-foreground"
                    )}
                  >
                    {TREND_BADGE[s.trend]?.glyph ?? s.trend}
                  </span>
                  <span
                    className={cn(
                      "tag shrink-0 hidden sm:inline-flex",
                      s.in_resume ? "text-signal" : "text-data"
                    )}
                  >
                    {s.in_resume ? "on resume" : "gap"}
                  </span>
                </div>
                <p className="text-[0.68rem] text-muted-foreground/80 leading-relaxed mt-1 ml-0 sm:ml-[10.75rem]">
                  {s.insight}
                </p>
              </div>
            ))}
          </div>

          {/* legend + adopt */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 border-t border-border/60">
            <p className="text-[0.7rem] text-muted-foreground flex-1 pt-3">
              <span className="text-data">■</span> missing from your resume ·{" "}
              <span className="text-signal">■</span> already covered
            </p>
            {result.recommended_focus.length > 0 && (
              <Button
                variant="outline"
                className="shrink-0 sm:mt-3"
                onClick={() => {
                  onAdopt(result.recommended_focus);
                  toast.success(
                    `${result.recommended_focus.length} gap skills added — generate your plan below`
                  );
                }}
              >
                Build roadmap for the gaps
              </Button>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

/* ============================================================
   SKILL PLAN — one skill's expandable learning plan
   ============================================================ */
function SkillPlan({ plan, index }: { plan: LearningPlan; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <Panel hud={open} className="transition-all duration-300">
      <button onClick={() => setOpen(!open)} className="w-full text-left">
        <div className="px-4 py-3.5 flex items-center gap-4">
          <span className="font-mono text-[0.62rem] text-data shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[0.82rem] tracking-[0.1em] uppercase">{plan.skill}</p>
            <p className="text-[0.72rem] text-muted-foreground mt-1 leading-relaxed line-clamp-1">
              {plan.why_important}
            </p>
          </div>
          <span className="tag text-caution shrink-0">{plan.total_duration}</span>
          <span className="font-mono text-muted-foreground">{open ? "−" : "+"}</span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/60 grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/60">
              {/* roadmap */}
              <div className="p-5">
                <p className="readout text-data mb-4">STEP-BY-STEP ROADMAP</p>
                <div className="relative pl-5 space-y-5">
                  <span className="absolute left-[5px] top-1 bottom-1 w-px bg-gradient-to-b from-data/60 to-transparent" />
                  {plan.roadmap.map((step) => (
                    <div key={step.step} className="relative">
                      <span className="absolute -left-[18.5px] top-1 w-[7px] h-[7px] rounded-full bg-data shadow-glow-data" />
                      <p className="text-[0.76rem] font-medium text-foreground">
                        {step.step}. {step.topic}
                      </p>
                      <p className="text-[0.72rem] text-muted-foreground mt-1 leading-relaxed">
                        {step.description}
                      </p>
                      <p className="font-mono text-[0.6rem] text-data/80 mt-1">{step.duration}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* resources + projects */}
              <div className="p-5 space-y-6">
                <div>
                  <p className="readout text-signal mb-3">RESOURCES</p>
                  <div className="space-y-2">
                    {plan.resources.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 border border-border/60 bg-background/40 px-3 py-2">
                        <Lamp color={r.free ? "text-signal" : "text-caution"} className="w-[5px] h-[5px]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.74rem] truncate">{r.title}</p>
                          <p className="text-[0.6rem] text-muted-foreground">
                            {[r.platform, r.type, r.duration].filter(Boolean).join(" · ")}
                            {r.free && " · Free"}
                          </p>
                        </div>
                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[0.66rem] text-muted-foreground hover:text-signal transition-colors"
                          >
                            ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {plan.projects.length > 0 && (
                  <div>
                    <p className="readout text-caution mb-3">PRACTICE PROJECTS</p>
                    <ul className="space-y-1.5">
                      {plan.projects.map((p, i) => (
                        <li key={i} className="text-[0.74rem] text-muted-foreground leading-relaxed flex gap-2.5">
                          <span className="font-mono text-caution shrink-0">{i + 1}.</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}

export default function LearningPage() {
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [currentLevel, setCurrentLevel] = useState("beginner");
  const [targetRole, setTargetRole] = useState("");
  const [result, setResult] = useState<LearningPlanResponse | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      learningApi
        .recommend({ skills, current_level: currentLevel, target_role: targetRole })
        .then((r) => r.data),
    onSuccess: (data) => {
      setResult(data);
      toast.success("Learning plan ready");
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Couldn't generate the plan"),
  });

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  return (
    <div className="px-4 lg:px-6 py-8">
      <ModuleHeader
        title="Learning"
        description="Tell us which skills you want to learn — get a step-by-step plan with free resources."
      />

      <MarketRadar onAdopt={(s) => setSkills(s)} />

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">
        {/* input */}
        <div className="space-y-5 lg:sticky lg:top-16">
          <Panel hud>
            <PanelHeader label="WHAT DO YOU WANT TO LEARN?" />
            <div className="p-4 space-y-3">
              <div>
                <p className="readout mb-1.5">TARGET ROLE</p>
                <Input
                  placeholder="e.g. Backend Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                />
              </div>
              <div>
                <p className="readout mb-1.5">YOUR CURRENT LEVEL</p>
                <Select value={currentLevel} onValueChange={setCurrentLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="readout mb-1.5">SKILLS TO LEARN</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. React, Docker…"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  />
                  <Button variant="outline" size="icon" onClick={addSkill}>＋</Button>
                </div>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSkills(skills.filter((x) => x !== s))}
                      className="tag text-data hover:text-alert transition-colors"
                      title="Remove"
                    >
                      {s} ✕
                    </button>
                  ))}
                </div>
              )}
              <Button
                className="w-full"
                disabled={skills.length === 0 || mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? "Generating…" : "Generate learning plan"}
              </Button>
            </div>
          </Panel>

          {result && (
            <Panel>
              <PanelHeader label="OVERVIEW" />
              <div className="p-4">
                <p className="readout mb-1.5">TOTAL TIMELINE</p>
                <p className="font-display text-xl text-signal glow-text tracking-wide">
                  {result.overall_timeline}
                </p>
                {result.priority_order.length > 0 && (
                  <div className="mt-4">
                    <p className="readout mb-2">LEARN IN THIS ORDER</p>
                    <div className="space-y-1.5">
                      {result.priority_order.map((s, i) => (
                        <p key={s} className="text-[0.74rem] text-muted-foreground">
                          <span className="font-mono text-signal">{i + 1}.</span> {s}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          )}
        </div>

        {/* plans */}
        <div className="space-y-4">
          {!result ? (
            <Panel>
              <NoSignal
                message="Add the skills you want to learn and we'll build a plan with free courses, docs and practice projects."
                className="py-28"
              />
            </Panel>
          ) : (
            result.skills.map((plan, i) => (
              <SkillPlan key={plan.skill} plan={plan} index={i} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
