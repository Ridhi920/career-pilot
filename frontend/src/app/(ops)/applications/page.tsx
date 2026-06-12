"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { applicationsApi } from "@/lib/api";
import { ModuleHeader } from "@/components/ops/ModuleHeader";
import {
  Panel,
  PanelHeader,
  Lamp,
  StatReadout,
  NoSignal,
  scoreColor,
} from "@/components/ops/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate } from "@/lib/utils";
import type { Application, ApplicationMetrics, ApplicationStatus } from "@/types";

const STAGES: { status: ApplicationStatus; label: string; lamp: string }[] = [
  { status: "Saved", label: "Saved", lamp: "text-muted-foreground" },
  { status: "Applied", label: "Applied", lamp: "text-data" },
  { status: "Interview", label: "Interview", lamp: "text-caution" },
  { status: "Offer", label: "Offer", lamp: "text-signal" },
];

const ORDER: ApplicationStatus[] = ["Saved", "Applied", "Interview", "Offer"];

/* ============================================================
   APPLICATION CARD
   ============================================================ */
function ApplicationCard({
  app,
  onMove,
  onReject,
  onDelete,
}: {
  app: Application;
  onMove: (dir: 1 | -1) => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const idx = ORDER.indexOf(app.status);
  const stage = STAGES[idx];

  return (
    <motion.div
      layout
      layoutId={`application-${app.id}`}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="group border border-border/70 bg-background/50 hover:border-signal/40 transition-colors"
    >
      <div className="px-3 pt-2.5 flex items-center justify-between">
        <span className="text-[0.62rem] text-muted-foreground">{formatDate(app.created_at)}</span>
        <span className="flex items-center gap-2">
          {app.ats_score != null && (
            <span
              className={cn("font-mono text-[0.62rem] tabular-nums", scoreColor(app.ats_score))}
              title="Resume match score"
            >
              {app.ats_score}
            </span>
          )}
          <Lamp color={stage?.lamp ?? "text-muted-foreground"} className="w-[5px] h-[5px]" />
        </span>
      </div>
      <div className="px-3 py-1.5">
        <p className="text-[0.8rem] font-medium leading-snug">{app.job_title}</p>
        <p className="text-[0.66rem] text-muted-foreground mt-0.5">{app.company}</p>
        {app.notes && (
          <p className="text-[0.68rem] text-muted-foreground/80 mt-1 line-clamp-1">{app.notes}</p>
        )}
      </div>
      {/* controls */}
      <div className="flex items-center border-t border-border/50 divide-x divide-border/50 opacity-60 group-hover:opacity-100 transition-opacity">
        <button
          className="flex-1 py-1.5 font-mono text-[0.62rem] text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          disabled={idx <= 0}
          onClick={() => onMove(-1)}
          title="Move back a stage"
        >
          ◂
        </button>
        <button
          className="flex-1 py-1.5 font-mono text-[0.62rem] text-signal hover:glow-text disabled:opacity-30 transition-all"
          disabled={idx >= ORDER.length - 1}
          onClick={() => onMove(1)}
          title="Move to next stage"
        >
          ▸
        </button>
        {app.job_url && (
          <a
            href={app.job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1.5 text-center font-mono text-[0.62rem] text-muted-foreground hover:text-data transition-colors"
            title="Open job listing"
          >
            ↗
          </a>
        )}
        <button
          className="flex-1 py-1.5 font-mono text-[0.62rem] text-muted-foreground hover:text-alert transition-colors"
          onClick={onReject}
          title="Mark as rejected"
        >
          ✕
        </button>
        <button
          className="flex-1 py-1.5 font-mono text-[0.62rem] text-muted-foreground/50 hover:text-alert transition-colors"
          onClick={onDelete}
          title="Delete"
        >
          ⌫
        </button>
      </div>
    </motion.div>
  );
}

/* ============================================================
   ADD APPLICATION form
   ============================================================ */
function AddApplicationForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    company: "",
    job_title: "",
    job_url: "",
    notes: "",
    status: "Saved" as ApplicationStatus,
  });

  const mutation = useMutation({
    mutationFn: () => applicationsApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      toast.success("Application added");
      onClose();
    },
    onError: () => toast.error("Failed to add application"),
  });

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <Panel hud className="mb-5">
        <PanelHeader
          label="ADD APPLICATION"
          extra={
            <button onClick={onClose} className="text-[0.7rem] text-muted-foreground hover:text-alert">
              ✕ Cancel
            </button>
          }
        />
        <div className="p-4 grid md:grid-cols-2 gap-3">
          <div>
            <p className="readout mb-1.5">COMPANY *</p>
            <Input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
          </div>
          <div>
            <p className="readout mb-1.5">JOB TITLE *</p>
            <Input value={form.job_title} onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))} />
          </div>
          <div>
            <p className="readout mb-1.5">JOB URL</p>
            <Input placeholder="https://…" value={form.job_url} onChange={(e) => setForm((f) => ({ ...f, job_url: e.target.value }))} />
          </div>
          <div>
            <p className="readout mb-1.5">STATUS</p>
            <div className="flex gap-1.5">
              {STAGES.map((t) => (
                <button
                  key={t.status}
                  onClick={() => setForm((f) => ({ ...f, status: t.status }))}
                  className={cn(
                    "flex-1 h-9 text-[0.64rem] font-medium border transition-all",
                    form.status === t.status
                      ? "border-signal/70 bg-signal/10 text-signal"
                      : "border-border text-muted-foreground hover:border-signal/40"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="readout mb-1.5">NOTES</p>
            <Textarea className="min-h-[60px]" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button
              disabled={!form.company || !form.job_title || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Saving…" : "Save application"}
            </Button>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

/* ============================================================
   PAGE
   ============================================================ */
export default function ApplicationsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showRejected, setShowRejected] = useState(false);

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["applications"],
    queryFn: () => applicationsApi.list().then((r) => r.data),
  });

  const { data: metrics } = useQuery<ApplicationMetrics>({
    queryKey: ["metrics"],
    queryFn: () => applicationsApi.metrics().then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ApplicationStatus }) =>
      applicationsApi.update(id, { status }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      if (vars.status === "Offer") toast.success("Offer! Congratulations 🎉");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => applicationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      toast.success("Application deleted");
    },
  });

  const move = (app: Application, dir: 1 | -1) => {
    const idx = ORDER.indexOf(app.status);
    const next = ORDER[Math.min(ORDER.length - 1, Math.max(0, idx + dir))];
    if (next !== app.status) updateMutation.mutate({ id: app.id, status: next });
  };

  const active = applications.filter((a) => a.status !== "Rejected");
  const rejected = applications.filter((a) => a.status === "Rejected");

  return (
    <div className="px-4 lg:px-6 py-8">
      <ModuleHeader
        title="Applications"
        description="Track every application as it moves from saved to applied to interview to offer."
        action={
          <Button onClick={() => setShowForm(true)}>＋ Add application</Button>
        }
      />

      {/* stats */}
      <Panel className="mb-5">
        <div className="px-5 py-4 grid grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-6">
          <StatReadout label="TOTAL" value={metrics?.total ?? 0} />
          <StatReadout label="SAVED" value={metrics?.saved ?? 0} color="text-muted-foreground" lamp="text-muted-foreground" />
          <StatReadout label="APPLIED" value={metrics?.applied ?? 0} color="text-data" lamp="text-data" />
          <StatReadout label="INTERVIEWS" value={metrics?.interviews ?? 0} color="text-caution" lamp="text-caution" />
          <StatReadout label="OFFERS" value={metrics?.offers ?? 0} color="text-signal" lamp="text-signal" />
          <StatReadout label="SUCCESS" value={metrics?.success_rate ?? 0} suffix="%" color="text-data" />
        </div>
      </Panel>

      <AnimatePresence>{showForm && <AddApplicationForm onClose={() => setShowForm(false)} />}</AnimatePresence>

      {/* progress board */}
      {isLoading ? (
        <Panel>
          <NoSignal message="Loading your applications…" className="py-24" />
        </Panel>
      ) : active.length === 0 ? (
        <Panel>
          <NoSignal message="No applications yet. Add one manually, or mark jobs as applied from the Jobs page." className="py-24">
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>＋ Add your first application</Button>
          </NoSignal>
        </Panel>
      ) : (
        <div className="relative">
          {/* progress line */}
          <div className="hidden md:block absolute top-[14px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-border via-data/40 to-signal/60" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {STAGES.map((stage) => {
              const list = active.filter((a) => a.status === stage.status);
              return (
                <div key={stage.status}>
                  {/* stage marker */}
                  <div className="relative flex flex-col items-center mb-4">
                    <span
                      className={cn("w-[9px] h-[9px] rounded-full z-10", stage.lamp)}
                      style={{ background: "currentColor", boxShadow: "0 0 12px currentColor" }}
                    />
                    <p className={cn("text-[0.72rem] font-medium mt-2.5", stage.lamp)}>
                      {stage.label}
                      <span className="text-muted-foreground/60 ml-1.5">({list.length})</span>
                    </p>
                  </div>
                  {/* cards */}
                  <div className="space-y-2.5 min-h-[60px]">
                    <AnimatePresence mode="popLayout">
                      {list.map((app) => (
                        <ApplicationCard
                          key={app.id}
                          app={app}
                          onMove={(dir) => move(app, dir)}
                          onReject={() => updateMutation.mutate({ id: app.id, status: "Rejected" })}
                          onDelete={() => deleteMutation.mutate(app.id)}
                        />
                      ))}
                    </AnimatePresence>
                    {list.length === 0 && (
                      <div className="border border-dashed border-border/50 py-5 text-center text-[0.64rem] text-muted-foreground/40">
                        empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* rejected */}
      {rejected.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowRejected(!showRejected)}
            className="w-full flex items-center gap-3 text-[0.72rem] text-muted-foreground hover:text-alert transition-colors"
          >
            <span className="text-alert/70 font-medium">Rejected ({rejected.length})</span>
            <span className="flex-1 axis opacity-60" />
            <span>{showRejected ? "Hide −" : "Show +"}</span>
          </button>
          <AnimatePresence>
            {showRejected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid md:grid-cols-3 gap-2.5 mt-4 opacity-70">
                  {rejected.map((app) => (
                    <div key={app.id} className="border border-alert/20 bg-alert/[0.03] px-3 py-2.5 flex items-center gap-3">
                      <Lamp color="text-alert" className="w-[5px] h-[5px]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.72rem] truncate">{app.job_title}</p>
                        <p className="text-[0.62rem] text-muted-foreground truncate">{app.company}</p>
                      </div>
                      <button
                        className="font-mono text-[0.6rem] text-muted-foreground hover:text-signal transition-colors"
                        onClick={() => updateMutation.mutate({ id: app.id, status: "Saved" })}
                        title="Move back to Saved"
                      >
                        ↺
                      </button>
                      <button
                        className="font-mono text-[0.6rem] text-muted-foreground hover:text-alert transition-colors"
                        onClick={() => deleteMutation.mutate(app.id)}
                        title="Delete"
                      >
                        ⌫
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
