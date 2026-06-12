"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api, resumeApi } from "@/lib/api";
import { ModuleHeader } from "@/components/ops/ModuleHeader";
import {
  Panel,
  PanelHeader,
  Lamp,
  NoSignal,
  scoreColor,
} from "@/components/ops/primitives";
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
import type { ResumeListItem } from "@/types";

const STATUS_LAMP: Record<string, string> = {
  Discovered: "text-muted-foreground",
  Scored: "text-data",
  Saved: "text-caution",
  Applied: "text-signal",
  Skipped: "text-alert",
};

const FILTERS = ["all", "Discovered", "Scored", "Saved", "Applied", "Skipped"];

/** "today" | "3d ago" | "2mo ago" — relative posting age. */
function postedAgo(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/* ============================================================
   JOB DETAILS — selected job + actions
   ============================================================ */
function JobDetails({
  job,
  resumeId,
  onRefresh,
}: {
  job: any;
  resumeId: string;
  onRefresh: () => void;
}) {
  const qc = useQueryClient();
  const [showCover, setShowCover] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [showDesc, setShowDesc] = useState(false);

  const opts = (path: string, success: string) => ({
    mutationFn: () =>
      api.post(`/api/jobs/${job.id}/${path}`, { resume_id: Number(resumeId) }).then((r: any) => r.data),
    onSuccess: () => {
      toast.success(success);
      onRefresh();
    },
    onError: () => toast.error("Something went wrong"),
  });

  const scoreMutation = useMutation(opts("score", "Job scored against your resume"));
  const coverMutation = useMutation(opts("cover-letter", "Cover letter generated"));
  const tailorMutation = useMutation(opts("tailored-resume", "Tailored resume generated"));

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/api/jobs/${job.id}/status`, { status }).then((r) => r.data),
    onSuccess: (_d, status) => {
      if (status === "Applied") {
        toast.success("Marked as applied — added to your applications");
        qc.invalidateQueries({ queryKey: ["applications"] });
        qc.invalidateQueries({ queryKey: ["metrics"] });
      }
      onRefresh();
    },
  });

  const rec = job.match_data?.recommendation;

  return (
    <Panel hud className="h-full">
      <PanelHeader
        label="JOB DETAILS"
        extra={
          <span className={cn("tag", STATUS_LAMP[job.status])}>{job.status}</span>
        }
      />
      <div className="p-4 space-y-4">
        {/* identity */}
        <div>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-sm tracking-wide hover:text-signal transition-colors leading-snug"
          >
            {job.title} ↗
          </a>
          <p className="text-[0.72rem] text-muted-foreground mt-1.5">
            {job.company}
            {job.location && ` · ${job.location}`} · <span className="capitalize">{job.source}</span>
            {postedAgo(job.posted_at) && <span className="text-caution"> · posted {postedAgo(job.posted_at)}</span>}
            {job.is_easy_apply && <span className="text-data"> · ⚡ Easy Apply</span>}
          </p>
        </div>

        {/* match */}
        {job.match_score != null ? (
          <div className="flex items-center gap-5 border border-border/70 bg-background/40 px-4 py-3">
            <span className={cn("font-mono text-3xl tabular-nums", scoreColor(job.match_score))}>
              {Math.round(job.match_score)}
              <span className="text-[0.6rem] text-muted-foreground">%</span>
            </span>
            <div className="flex-1">
              <p className="readout mb-1">MATCH WITH YOUR RESUME</p>
              {rec && (
                <p
                  className={cn(
                    "text-[0.74rem] font-medium",
                    rec === "apply" ? "text-signal" : rec === "maybe" ? "text-caution" : "text-alert"
                  )}
                >
                  AI suggests: {rec === "apply" ? "Apply" : rec === "maybe" ? "Maybe" : "Skip"}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-border px-4 py-3 text-[0.72rem] text-muted-foreground">
            {resumeId
              ? "Not scored yet — click Score below to see how well you match."
              : "Select a resume in the search panel above to enable scoring."}
          </div>
        )}

        {job.match_data?.reason && (
          <p className="text-[0.76rem] text-muted-foreground leading-relaxed">{job.match_data.reason}</p>
        )}

        {/* skills */}
        {(job.match_data?.matching_skills?.length > 0 || job.match_data?.missing_skills?.length > 0) && (
          <div className="grid grid-cols-1 gap-3">
            {job.match_data.matching_skills?.length > 0 && (
              <div>
                <p className="readout text-signal mb-2">SKILLS YOU HAVE</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.match_data.matching_skills.map((s: string) => (
                    <span key={s} className="tag text-signal">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {job.match_data.missing_skills?.length > 0 && (
              <div>
                <p className="readout text-alert mb-2">SKILLS YOU'RE MISSING</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.match_data.missing_skills.map((s: string) => (
                    <span key={s} className="tag text-alert">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {job.match_score == null && resumeId && (
            <Button variant="outline" size="sm" disabled={scoreMutation.isPending} onClick={() => scoreMutation.mutate()}>
              {scoreMutation.isPending ? "Scoring…" : "Score"}
            </Button>
          )}
          {resumeId && !job.cover_letter && (
            <Button variant="outline" size="sm" disabled={coverMutation.isPending} onClick={() => coverMutation.mutate()}>
              {coverMutation.isPending ? "Writing…" : "Cover letter"}
            </Button>
          )}
          {resumeId && !job.tailored_resume && (
            <Button variant="outline" size="sm" disabled={tailorMutation.isPending} onClick={() => tailorMutation.mutate()}>
              {tailorMutation.isPending ? "Tailoring…" : "Tailor resume"}
            </Button>
          )}
          {job.status !== "Applied" && job.status !== "Skipped" && (
            <Button size="sm" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate("Applied")}>
              ✓ Mark applied
            </Button>
          )}
          {job.status !== "Skipped" && job.status !== "Applied" && (
            <Button variant="ghost" size="sm" onClick={() => statusMutation.mutate("Skipped")}>
              ✕ Skip
            </Button>
          )}
        </div>

        {/* generated content */}
        {job.cover_letter && (
          <div className="border border-border/70">
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-[0.7rem] text-muted-foreground hover:text-signal transition-colors"
              onClick={() => setShowCover(!showCover)}
            >
              <span>Cover letter</span>
              <span className="flex gap-3">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(job.cover_letter);
                    toast.success("Copied");
                  }}
                >
                  ⧉
                </span>
                <span>{showCover ? "−" : "+"}</span>
              </span>
            </button>
            {showCover && (
              <div className="px-3 pb-3 text-[0.72rem] text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
                {job.cover_letter}
              </div>
            )}
          </div>
        )}
        {job.tailored_resume && (
          <div className="border border-border/70">
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-[0.7rem] text-muted-foreground hover:text-signal transition-colors"
              onClick={() => setShowResume(!showResume)}
            >
              <span>Tailored resume</span>
              <span className="flex gap-3">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(job.tailored_resume);
                    toast.success("Copied");
                  }}
                >
                  ⧉
                </span>
                <span>{showResume ? "−" : "+"}</span>
              </span>
            </button>
            {showResume && (
              <pre className="px-3 pb-3 font-mono text-[0.66rem] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto text-muted-foreground">
                {job.tailored_resume}
              </pre>
            )}
          </div>
        )}
        {job.description && (
          <div className="border border-border/70">
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-[0.7rem] text-muted-foreground hover:text-signal transition-colors"
              onClick={() => setShowDesc(!showDesc)}
            >
              <span>Job description</span>
              <span>{showDesc ? "−" : "+"}</span>
            </button>
            {showDesc && (
              <div className="px-3 pb-3 text-[0.72rem] text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
                {job.description}
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ============================================================
   PAGE
   ============================================================ */
export default function JobsPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("India");
  const [sources, setSources] = useState<string[]>(["linkedin", "naukri"]);
  const [numJobs, setNumJobs] = useState("20");
  const [resumeId, setResumeId] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: resumes = [] } = useQuery<ResumeListItem[]>({
    queryKey: ["resumes"],
    queryFn: () => resumeApi.list().then((r) => r.data),
  });

  const { data: jobs = [], refetch } = useQuery<any[]>({
    queryKey: ["jobs", filter],
    queryFn: () =>
      api
        .get("/api/jobs", { params: filter !== "all" ? { status: filter } : {} })
        .then((r) => r.data),
  });

  const discoverMutation = useMutation({
    mutationFn: () =>
      api
        .post("/api/jobs/discover", {
          query,
          location,
          sources,
          num_jobs: Number(numJobs),
          resume_id: resumeId ? Number(resumeId) : null,
        })
        .then((r) => r.data),
    onSuccess: (d) => {
      toast.success(`Found ${d.discovered} jobs, scored ${d.scored}`);
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Search failed"),
  });

  const syncMutation = useMutation({
    mutationFn: () => api.post("/api/jobs/sync-linkedin", {}).then((r) => r.data),
    onSuccess: (d) => {
      toast.success(
        d.imported > 0
          ? `Imported ${d.imported} from LinkedIn (${d.skipped} already tracked)`
          : `No new applications — ${d.skipped} already tracked`
      );
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "LinkedIn sync failed"),
  });

  const digestMutation = useMutation({
    mutationFn: () => api.post("/api/jobs/digest").then((r) => r.data),
    onSuccess: (d) => {
      if (d.sent) toast.success(`Telegram digest sent (${d.jobs_count} jobs)`);
      else toast.warning("Telegram not configured — add TELEGRAM_BOT_TOKEN to .env");
    },
  });

  const toggleSource = (s: string) =>
    setSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const selectedJob = jobs.find((j) => j.id === selectedId) ?? null;

  return (
    <div className="px-4 lg:px-6 py-8">
      <ModuleHeader
        title="Jobs"
        description="Search LinkedIn and Naukri, see how well each job matches your resume, and apply with AI-generated cover letters."
        action={
          <>
            <Button variant="outline" size="sm" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? "Syncing…" : "⇄ Sync LinkedIn"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => digestMutation.mutate()} disabled={digestMutation.isPending}>
              {digestMutation.isPending ? "Sending…" : "Send Telegram digest"}
            </Button>
          </>
        }
      />

      {/* search */}
      <Panel hud className="mb-5">
        <PanelHeader label="SEARCH JOBS" />
        <div className="p-4 grid grid-cols-2 md:grid-cols-12 gap-3 items-end">
          <div className="col-span-2 md:col-span-3">
            <p className="readout mb-1.5">JOB TITLE / KEYWORDS</p>
            <Input placeholder="e.g. Python Developer" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <p className="readout mb-1.5">LOCATION</p>
            <Input placeholder="e.g. Bangalore" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <p className="readout mb-1.5">SOURCES</p>
            <div className="flex gap-1.5">
              {["linkedin", "naukri"].map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSource(s)}
                  className={cn(
                    "flex-1 h-9 text-[0.68rem] font-medium capitalize border transition-all",
                    sources.includes(s)
                      ? "border-signal/70 bg-signal/10 text-signal"
                      : "border-border text-muted-foreground hover:border-signal/40"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-1">
            <p className="readout mb-1.5">HOW MANY</p>
            <Select value={numJobs} onValueChange={setNumJobs}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["10", "20", "30", "50"].map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <p className="readout mb-1.5">SCORE AGAINST</p>
            <Select value={resumeId} onValueChange={setResumeId}>
              <SelectTrigger><SelectValue placeholder="Pick a resume…" /></SelectTrigger>
              <SelectContent>
                {resumes.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.file_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 md:col-span-2">
            <Button
              className="w-full"
              disabled={!query || sources.length === 0 || discoverMutation.isPending}
              onClick={() => discoverMutation.mutate()}
            >
              {discoverMutation.isPending ? "Searching…" : "Search jobs"}
            </Button>
          </div>
        </div>
        {discoverMutation.isPending && (
          <p className="px-4 pb-3 text-[0.68rem] text-muted-foreground animate-lamp-pulse">
            Searching job boards and scoring matches against your resume…
          </p>
        )}
      </Panel>

      {/* filters */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setSelectedId(null); }}
            className={cn(
              "px-3 py-1.5 text-[0.7rem] font-medium border transition-all",
              filter === f
                ? "border-signal/70 bg-signal/10 text-signal"
                : "border-border/70 text-muted-foreground hover:border-signal/40"
            )}
          >
            {f === "all" ? `All (${jobs.length})` : f}
          </button>
        ))}
      </div>

      {jobs.length === 0 ? (
        <Panel>
          <NoSignal message="No jobs yet. Use the search above to find openings — each one will appear here with a match score against your resume." className="py-24" />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* list */}
          <Panel>
            <PanelHeader
              label="RESULTS"
              extra={
                <span className="font-mono text-[0.64rem] text-muted-foreground tabular-nums">
                  {jobs.length} job{jobs.length === 1 ? "" : "s"}
                </span>
              }
            />
            <div className="max-h-[36rem] overflow-y-auto">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedId(job.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-150 border-l-2",
                    job.id === selectedId
                      ? "border-l-signal bg-signal/5"
                      : "border-l-transparent hover:bg-accent/40"
                  )}
                >
                  <Lamp color={STATUS_LAMP[job.status] ?? "text-muted-foreground"} className="w-[5px] h-[5px]" />
                  <span className="text-[0.74rem] flex-1 truncate">
                    {job.title} <span className="text-muted-foreground">· {job.company}</span>
                  </span>
                  {postedAgo(job.posted_at) && (
                    <span className="font-mono text-[0.62rem] text-muted-foreground tabular-nums shrink-0">
                      {postedAgo(job.posted_at)}
                    </span>
                  )}
                  {job.match_score != null && (
                    <span className={cn("font-mono text-[0.66rem] tabular-nums", scoreColor(job.match_score))}>
                      {Math.round(job.match_score)}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Panel>

          {/* details */}
          <div className="lg:sticky lg:top-16">
            <AnimatePresence mode="wait">
              {selectedJob ? (
                <motion.div
                  key={selectedJob.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <JobDetails job={selectedJob} resumeId={resumeId} onRefresh={() => refetch()} />
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Panel>
                    <NoSignal message="Select a job from the list to see its details and actions." className="py-24" />
                  </Panel>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
