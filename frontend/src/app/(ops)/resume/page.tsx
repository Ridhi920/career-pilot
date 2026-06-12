"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { resumeApi, analysisApi } from "@/lib/api";
import { ModuleHeader } from "@/components/ops/ModuleHeader";
import {
  Panel,
  PanelHeader,
  Lamp,
  ScannerGauge,
  TelemetryBar,
  NoSignal,
  scoreColor,
} from "@/components/ops/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate } from "@/lib/utils";
import type { ATSAnalysis, ATSScore, ResumeListItem, ResumeGenerated, SkillGap } from "@/types";

type Tab = "score" | "match" | "optimize";

const TABS: { id: Tab; label: string }[] = [
  { id: "score", label: "ATS Score" },
  { id: "match", label: "Match a Job" },
  { id: "optimize", label: "Optimize" },
];

/* ============================================================
   YOUR RESUMES — list + upload
   ============================================================ */
function ResumeList({
  resumes,
  selectedId,
  onSelect,
}: {
  resumes: ResumeListItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const qc = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => resumeApi.upload(file).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["resumes"] });
      onSelect(data.id);
      toast.success("Resume uploaded and scored");
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Upload failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => resumeApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Resume deleted");
    },
  });

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) uploadMutation.mutate(accepted[0]);
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <Panel hud>
      <PanelHeader
        label="YOUR RESUMES"
        extra={<span className="font-mono text-[0.6rem] text-muted-foreground">{resumes.length}</span>}
      />
      <div className="p-3 space-y-2">
        {/* upload area */}
        <div
          {...getRootProps()}
          className={cn(
            "relative border border-dashed px-4 py-6 text-center cursor-pointer transition-all duration-300 overflow-hidden",
            isDragActive
              ? "border-signal bg-signal/5"
              : "border-border hover:border-signal/50 hover:bg-accent/30"
          )}
        >
          <input {...getInputProps()} />
          {uploadMutation.isPending && <div className="scan-beam" />}
          {uploadMutation.isPending ? (
            <p className="text-[0.74rem] text-signal animate-lamp-pulse">
              Uploading, reading and scoring…
            </p>
          ) : isDragActive ? (
            <p className="text-[0.74rem] text-signal">Drop it here</p>
          ) : (
            <>
              <p className="text-[0.78rem] font-medium">＋ Upload a resume</p>
              <p className="text-[0.64rem] text-muted-foreground mt-1.5">PDF or DOCX · max 10MB</p>
            </>
          )}
        </div>

        {/* list */}
        {resumes.map((r) => {
          const active = r.id === selectedId;
          const score = r.ats_analysis?.score;
          return (
            <div
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 border cursor-pointer transition-all duration-200",
                active
                  ? "border-signal/70 bg-signal/5 shadow-glow-sm"
                  : "border-border/70 hover:border-signal/40"
              )}
            >
              <Lamp
                color={score != null ? scoreColor(score) : "text-muted-foreground"}
                className="w-[5px] h-[5px]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[0.74rem] truncate">{r.file_name}</p>
                <p className="text-[0.62rem] text-muted-foreground">
                  {formatDate(r.created_at)}
                  {r.parsed_data?.name && ` · ${r.parsed_data.name}`}
                </p>
              </div>
              {score != null && (
                <span className={cn("font-mono text-[0.7rem] tabular-nums", scoreColor(score))}>
                  {Math.round(score)}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate(r.id);
                }}
                className="opacity-0 group-hover:opacity-100 font-mono text-[0.6rem] text-muted-foreground hover:text-alert transition-all"
                aria-label="Delete resume"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ============================================================
   TAB 1 — ATS SCORE: how strong is this resume on its own?
   ============================================================ */
function ScoreTab({ resumeId }: { resumeId: number }) {
  const qc = useQueryClient();
  const [rescoring, setRescoring] = useState(false);

  const { data: ats, isLoading, isError, refetch } = useQuery<ATSScore>({
    queryKey: ["ats-score", resumeId],
    queryFn: () => analysisApi.atsScore(resumeId).then((r) => r.data),
    retry: 1,
  });

  const rescore = async () => {
    setRescoring(true);
    try {
      const { data } = await analysisApi.atsScore(resumeId, true);
      qc.setQueryData(["ats-score", resumeId], data);
      toast.success("Resume re-scored");
    } catch {
      toast.error("Re-scoring failed");
    } finally {
      setRescoring(false);
    }
  };

  if (isLoading) {
    return (
      <Panel className="relative overflow-hidden">
        <div className="scan-beam" />
        <NoSignal message="Scoring your resume against ATS criteria…" className="py-24" />
      </Panel>
    );
  }

  if (isError || !ats) {
    return (
      <Panel>
        <NoSignal message="We couldn't score this resume." className="py-20">
          <Button variant="outline" size="sm" onClick={() => refetch()}>↻ Try again</Button>
        </NoSignal>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      {/* score + breakdown */}
      <Panel hud>
        <PanelHeader
          label="ATS SCORE"
          extra={
            <button
              onClick={rescore}
              disabled={rescoring}
              className="text-[0.68rem] text-muted-foreground hover:text-signal transition-colors disabled:opacity-40"
            >
              {rescoring ? "Re-scoring…" : "↻ Re-score"}
            </button>
          }
        />
        <div className="p-6 grid md:grid-cols-[auto_1fr] gap-8 items-center">
          <ScannerGauge score={Math.round(ats.score)} label="OUT OF 100" sublabel={ats.rating} />
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">{ats.summary}</p>
            <div className="space-y-4">
              {ats.breakdown.map((b) => (
                <TelemetryBar key={b.category} label={b.category} value={b.score} detail={b.feedback} />
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* strengths / issues */}
      <div className="grid md:grid-cols-2 gap-5">
        <Panel>
          <PanelHeader label={`STRENGTHS (${ats.strengths.length})`} extra={<Lamp color="text-signal" className="w-[5px] h-[5px]" />} />
          <ul className="p-4 space-y-2.5">
            {ats.strengths.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-[0.8rem] leading-relaxed">
                <span className="text-signal font-mono shrink-0">+</span>
                {s}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <PanelHeader label={`ISSUES (${ats.issues.length})`} extra={<Lamp color="text-alert" className="w-[5px] h-[5px]" />} />
          <ul className="p-4 space-y-2.5">
            {ats.issues.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-[0.8rem] leading-relaxed">
                <span className="text-alert font-mono shrink-0">!</span>
                {s}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* improvements */}
      {ats.improvements.length > 0 && (
        <Panel>
          <PanelHeader label="SUGGESTED IMPROVEMENTS" />
          <div className="divide-y divide-border/60">
            {ats.improvements.map((imp, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <span
                  className={cn(
                    "tag mt-0.5 shrink-0",
                    imp.priority === "high"
                      ? "text-alert"
                      : imp.priority === "medium"
                        ? "text-caution"
                        : "text-muted-foreground"
                  )}
                >
                  {imp.priority}
                </span>
                <div>
                  {imp.section && (
                    <p className="text-[0.64rem] text-muted-foreground uppercase tracking-wider mb-1">
                      {imp.section}
                    </p>
                  )}
                  <p className="text-[0.8rem] leading-relaxed">{imp.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* keywords */}
      {ats.keyword_suggestions.length > 0 && (
        <Panel>
          <PanelHeader label="KEYWORDS WORTH ADDING" />
          <div className="p-4 flex flex-wrap gap-2">
            {ats.keyword_suggestions.map((k) => (
              <span key={k} className="tag text-data">{k}</span>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ============================================================
   TAB 2 — MATCH A JOB: resume vs a job description
   ============================================================ */
function MatchTab({
  resumeId,
  jd,
  setJd,
}: {
  resumeId: number;
  jd: string;
  setJd: (v: string) => void;
}) {
  const [ats, setAts] = useState<ATSAnalysis | null>(null);
  const [gap, setGap] = useState<SkillGap | null>(null);

  const atsMutation = useMutation({
    mutationFn: () => analysisApi.ats(resumeId, jd).then((r) => r.data),
    onSuccess: setAts,
    onError: (e: any) => toast.error(e.response?.data?.detail || "Analysis failed"),
  });
  const gapMutation = useMutation({
    mutationFn: () => analysisApi.skillGap(resumeId, jd).then((r) => r.data),
    onSuccess: setGap,
    onError: () => {},
  });

  const running = atsMutation.isPending || gapMutation.isPending;
  const run = () => {
    atsMutation.mutate();
    gapMutation.mutate();
  };

  return (
    <div className="space-y-5">
      <Panel hud>
        <PanelHeader label="JOB DESCRIPTION" extra={
          <span className="font-mono text-[0.6rem] text-muted-foreground tabular-nums">
            {jd.length} chars / min 50
          </span>
        } />
        <div className="p-4 space-y-3">
          <Textarea
            className="min-h-[140px] text-[0.8rem] leading-relaxed"
            placeholder="Paste the job description you want to compare against…"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
          <Button className="w-full" disabled={jd.length < 50 || running} onClick={run}>
            {running ? "Analyzing…" : "Analyze match"}
          </Button>
        </div>
      </Panel>

      {ats && (
        <Panel hud>
          <PanelHeader label="HOW WELL YOU MATCH" />
          <div className="p-6 grid md:grid-cols-[auto_1fr] gap-8 items-center">
            <ScannerGauge score={ats.score} label="MATCH" />
            <div className="space-y-4">
              <TelemetryBar label="Keyword coverage" value={ats.keyword_coverage} />
              <p className="text-sm text-muted-foreground leading-relaxed">{ats.summary}</p>
              <p className="text-[0.78rem] text-muted-foreground">
                <span className="text-foreground font-medium">Experience: </span>
                {ats.experience_match}
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 border-t border-border/60 divide-y md:divide-y-0 md:divide-x divide-border/60">
            <div className="p-4">
              <p className="readout text-signal mb-3">MATCHING SKILLS ({ats.matching_skills.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {ats.matching_skills.map((s) => (
                  <span key={s} className="tag text-signal">{s}</span>
                ))}
              </div>
            </div>
            <div className="p-4">
              <p className="readout text-alert mb-3">MISSING SKILLS ({ats.missing_skills.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {ats.missing_skills.map((s) => (
                  <span key={s} className="tag text-alert">{s}</span>
                ))}
              </div>
            </div>
          </div>
          {ats.recommendations.length > 0 && (
            <div className="border-t border-border/60 p-4 space-y-2">
              <p className="readout mb-2">RECOMMENDATIONS</p>
              {ats.recommendations.map((r, i) => (
                <p key={i} className="text-[0.8rem] leading-relaxed flex gap-2.5">
                  <span className="font-mono text-signal shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  {r}
                </p>
              ))}
            </div>
          )}
        </Panel>
      )}

      {gap && (
        <Panel>
          <PanelHeader
            label="SKILL GAP"
            extra={
              gap.estimated_preparation_time && (
                <span className="font-mono text-[0.6rem] text-caution">
                  est. prep: {gap.estimated_preparation_time}
                </span>
              )
            }
          />
          <div className="divide-y divide-border/60">
            {[
              { items: gap.critical_missing, label: "MUST LEARN", color: "text-alert" },
              { items: gap.medium_priority, label: "GOOD TO HAVE", color: "text-caution" },
              { items: gap.optional, label: "BONUS", color: "text-data" },
            ].map(
              ({ items, label, color }) =>
                items?.length > 0 && (
                  <div key={label} className="p-4">
                    <p className={cn("readout mb-3", color)}>{label} ({items.length})</p>
                    <div className="space-y-2.5">
                      {items.map((item) => (
                        <div key={item.skill} className="flex items-baseline gap-3">
                          <span className="font-mono text-[0.74rem] text-foreground shrink-0 w-32 truncate">
                            {item.skill}
                          </span>
                          <span className="text-[0.74rem] text-muted-foreground leading-relaxed">
                            {item.reason}
                            {item.learning_time && (
                              <span className="font-mono text-[0.62rem] text-data ml-2">
                                ~{item.learning_time}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )}
            {gap.learning_roadmap.length > 0 && (
              <div className="p-4">
                <p className="readout mb-3">LEARNING ROADMAP</p>
                <ol className="space-y-2">
                  {gap.learning_roadmap.map((step, i) => (
                    <li key={i} className="flex gap-3 text-[0.8rem] leading-relaxed">
                      <span className="font-mono text-signal text-[0.7rem] shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ============================================================
   TAB 3 — OPTIMIZE: generate an improved version
   ============================================================ */
function OptimizeTab({
  resumeId,
  jd,
  setJd,
}: {
  resumeId: number;
  jd: string;
  setJd: (v: string) => void;
}) {
  const [result, setResult] = useState<ResumeGenerated | null>(null);

  const mutation = useMutation({
    mutationFn: () => analysisApi.generate(resumeId, jd).then((r) => r.data),
    onSuccess: (data) => {
      setResult(data);
      toast.success("Optimized resume ready");
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Generation failed"),
  });

  return (
    <div className="grid lg:grid-cols-2 gap-5 items-start">
      <div className="space-y-5">
        <Panel hud>
          <PanelHeader label="TARGET JOB DESCRIPTION" />
          <div className="p-4 space-y-3">
            <Textarea
              className="min-h-[180px] text-[0.8rem] leading-relaxed"
              placeholder="Paste the job description you want this resume tailored for…"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={jd.length < 50 || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Generating…" : "Generate optimized resume"}
            </Button>
            {mutation.isPending && (
              <p className="text-[0.68rem] text-muted-foreground text-center animate-lamp-pulse">
                Picking your most relevant experience and rewriting…
              </p>
            )}
          </div>
        </Panel>

        {result && (
          <Panel hud>
            <PanelHeader label="SCORE IMPROVEMENT" />
            <div className="p-6 flex items-center justify-around">
              <div className="text-center">
                <p className={cn("font-mono text-4xl tabular-nums", scoreColor(result.ats_score_before))}>
                  {result.ats_score_before}
                </p>
                <p className="readout mt-2">BEFORE</p>
              </div>
              <div className="text-center text-signal font-mono">
                <p className="text-xl glow-text">
                  ▲ +{Math.max(0, result.ats_score_after - result.ats_score_before).toFixed(0)}
                </p>
                <p className="text-[0.58rem] tracking-[0.2em] text-muted-foreground mt-1">GAIN</p>
              </div>
              <div className="text-center">
                <p className={cn("font-mono text-4xl tabular-nums glow-text", scoreColor(result.ats_score_after))}>
                  {result.ats_score_after}
                </p>
                <p className="readout mt-2">AFTER</p>
              </div>
            </div>
            {result.changes_made.length > 0 && (
              <div className="border-t border-border/60 p-4 space-y-2">
                <p className="readout mb-2">WHAT CHANGED ({result.changes_made.length})</p>
                {result.changes_made.map((c, i) => (
                  <p key={i} className="text-[0.78rem] leading-relaxed flex gap-2.5">
                    <span className="text-signal font-mono shrink-0">+</span>
                    {c}
                  </p>
                ))}
              </div>
            )}
          </Panel>
        )}
      </div>

      <Panel className="lg:sticky lg:top-16">
        <PanelHeader
          label={result ? "OPTIMIZED RESUME" : "RESULT"}
          extra={
            result && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.optimized_resume);
                  toast.success("Copied to clipboard");
                }}
                className="text-[0.68rem] text-muted-foreground hover:text-signal transition-colors"
              >
                ⧉ Copy
              </button>
            )
          }
        />
        {!result ? (
          <NoSignal message="Your improved, ATS-friendly resume will appear here." className="py-24" />
        ) : (
          <pre className="p-4 font-mono text-[0.7rem] leading-relaxed whitespace-pre-wrap max-h-[70vh] overflow-y-auto text-foreground/90">
            {result.optimized_resume}
          </pre>
        )}
      </Panel>
    </div>
  );
}

/* ============================================================
   PAGE
   ============================================================ */
export default function ResumePage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("score");
  const [jd, setJd] = useState("");

  const { data: resumes = [] } = useQuery<ResumeListItem[]>({
    queryKey: ["resumes"],
    queryFn: () => resumeApi.list().then((r) => r.data),
  });

  useEffect(() => {
    if (selectedId == null && resumes.length > 0) setSelectedId(resumes[0].id);
  }, [resumes, selectedId]);

  return (
    <div className="px-4 lg:px-6 py-8">
      <ModuleHeader
        title="Resume"
        description="Upload your resume, see its ATS score, compare it to jobs, and generate improved versions."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
        <div className="lg:sticky lg:top-16">
          <ResumeList resumes={resumes} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        <div>
          {/* tabs */}
          <div className="flex border border-border/70 bg-card/60 mb-5 overflow-hidden">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex-1 px-4 py-3 text-[0.78rem] font-medium transition-colors duration-200",
                  tab === t.id ? "text-signal" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                {tab === t.id && (
                  <motion.span
                    layoutId="tab-active"
                    className="absolute inset-0 bg-signal/8 border-b-2 border-signal"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            ))}
          </div>

          {selectedId == null ? (
            <Panel>
              <NoSignal message="No resume yet. Upload a PDF or DOCX on the left to get started." className="py-24" />
            </Panel>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={tab + selectedId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {tab === "score" && <ScoreTab resumeId={selectedId} />}
                {tab === "match" && <MatchTab resumeId={selectedId} jd={jd} setJd={setJd} />}
                {tab === "optimize" && <OptimizeTab resumeId={selectedId} jd={jd} setJd={setJd} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
