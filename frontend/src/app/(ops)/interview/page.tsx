"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { interviewApi, resumeApi } from "@/lib/api";
import { ModuleHeader } from "@/components/ops/ModuleHeader";
import {
  Panel,
  PanelHeader,
  Lamp,
  NoSignal,
  Ticker,
} from "@/components/ops/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { InterviewQuestions, InterviewSession, ResumeListItem } from "@/types";

type ActiveQuestion = { text: string; type: string };

const TYPE_STYLE: Record<string, string> = {
  technical: "text-data",
  behavioral: "text-ghost",
  scenario: "text-caution",
  culture: "text-signal",
};

/** small score dial */
function ScoreDial({ label, value }: { label: string; value: number }) {
  const pct = value * 10;
  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto">
        <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
          <circle cx="30" cy="30" r="24" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
          <motion.circle
            cx="30" cy="30" r="24" fill="none"
            stroke="hsl(var(--ghost))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 24}
            initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - pct / 100) }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: "drop-shadow(0 0 4px hsl(var(--ghost)))" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm text-ghost tabular-nums">
          {value.toFixed(1)}
        </span>
      </div>
      <p className="readout mt-2">{label}</p>
    </div>
  );
}

export default function InterviewPage() {
  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [questions, setQuestions] = useState<InterviewQuestions | null>(null);
  const [active, setActive] = useState<ActiveQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [session, setSession] = useState<InterviewSession | null>(null);

  const { data: resumes = [] } = useQuery<ResumeListItem[]>({
    queryKey: ["resumes"],
    queryFn: () => resumeApi.list().then((r) => r.data),
  });

  const questionsMutation = useMutation({
    mutationFn: () =>
      interviewApi
        .generateQuestions({
          job_description: jobDescription,
          job_role: jobRole,
          num_questions: 5,
          resume_id: resumeId ? Number(resumeId) : undefined,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setQuestions(data);
      setSession(null);
      setActive(null);
      toast.success("Questions ready");
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Couldn't generate questions"),
  });

  const evaluateMutation = useMutation({
    mutationFn: () =>
      interviewApi
        .evaluate({
          question: active!.text,
          answer,
          question_type: active!.type,
          job_role: jobRole,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setSession(data);
      toast.success("Feedback ready");
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Evaluation failed"),
  });

  const queue: ActiveQuestion[] = questions
    ? [
        ...questions.technical.map((q) => ({ text: q, type: "technical" })),
        ...questions.behavioral.map((q) => ({ text: q, type: "behavioral" })),
        ...questions.scenario.map((q) => ({ text: q, type: "scenario" })),
        ...questions.company_style.map((q) => ({ text: q, type: "culture" })),
      ]
    : [];

  return (
    <div className="px-4 lg:px-6 py-8">
      <ModuleHeader
        title="Interview Practice"
        description="Generate realistic questions for your target role, answer them, and get detailed AI feedback."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">
        {/* left: setup + questions */}
        <div className="space-y-5 lg:sticky lg:top-16">
          <Panel hud>
            <PanelHeader label="SETUP" extra={<Lamp color="text-ghost" pulse className="w-[5px] h-[5px]" />} />
            <div className="p-4 space-y-3">
              <div>
                <p className="readout mb-1.5">JOB ROLE *</p>
                <Input
                  placeholder="e.g. Senior Software Engineer"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                />
              </div>
              <div>
                <p className="readout mb-1.5">RESUME (OPTIONAL)</p>
                <Select value={resumeId} onValueChange={setResumeId}>
                  <SelectTrigger><SelectValue placeholder="Pick a resume…" /></SelectTrigger>
                  <SelectContent>
                    {resumes.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.file_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="readout mb-1.5">JOB DESCRIPTION</p>
                <Textarea
                  className="min-h-[110px] text-[0.78rem]"
                  placeholder="Paste the job description…"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={!jobRole || jobDescription.length < 20 || questionsMutation.isPending}
                onClick={() => questionsMutation.mutate()}
              >
                {questionsMutation.isPending ? "Generating…" : "Generate questions"}
              </Button>
            </div>
          </Panel>

          {queue.length > 0 && (
            <Panel>
              <PanelHeader
                label="QUESTIONS"
                extra={<span className="font-mono text-[0.6rem] text-muted-foreground">{queue.length}</span>}
              />
              <div className="max-h-[340px] overflow-y-auto divide-y divide-border/50">
                {queue.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActive(q);
                      setAnswer("");
                      setSession(null);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors duration-150 border-l-2",
                      active?.text === q.text
                        ? "border-l-ghost bg-ghost/5"
                        : "border-l-transparent hover:bg-accent/40"
                    )}
                  >
                    <span className={cn("text-[0.6rem] font-medium uppercase tracking-wider", TYPE_STYLE[q.type])}>
                      {i + 1}. {q.type}
                    </span>
                    <p className="text-[0.74rem] leading-snug mt-1 line-clamp-2 text-foreground/85">{q.text}</p>
                  </button>
                ))}
              </div>
            </Panel>
          )}
        </div>

        {/* right: practice area */}
        <div className="space-y-5">
          {!active ? (
            <Panel>
              <NoSignal
                message="Generate questions, then pick one from the list to start practicing."
                className="py-28"
              />
            </Panel>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={active.text}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5"
              >
                {/* question */}
                <Panel hud className="border-ghost/40">
                  <PanelHeader
                    label="QUESTION"
                    extra={
                      <span className={cn("tag", TYPE_STYLE[active.type])}>{active.type}</span>
                    }
                  />
                  <p className="p-5 text-[0.92rem] leading-relaxed text-foreground border-l-2 border-ghost/60 m-4 pl-4">
                    {active.text}
                  </p>
                </Panel>

                {/* answer */}
                <Panel>
                  <PanelHeader label="YOUR ANSWER" extra={
                    <span className="font-mono text-[0.6rem] text-muted-foreground tabular-nums">{answer.length} chars</span>
                  } />
                  <div className="p-4 space-y-3">
                    <Textarea
                      className="min-h-[150px] text-[0.84rem] leading-relaxed"
                      placeholder="Type your answer. For behavioral questions, try the STAR format — Situation, Task, Action, Result…"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      disabled={answer.length < 10 || evaluateMutation.isPending}
                      onClick={() => evaluateMutation.mutate()}
                    >
                      {evaluateMutation.isPending ? "Evaluating…" : "Get AI feedback"}
                    </Button>
                  </div>
                </Panel>

                {/* feedback */}
                {session?.feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Panel hud>
                      <PanelHeader
                        label="FEEDBACK"
                        extra={
                          <span className="font-mono text-[0.7rem] text-ghost tabular-nums">
                            <Ticker value={session.score ?? 0} decimals={1} /> / 10
                          </span>
                        }
                      />
                      <div className="p-5 space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                          <ScoreDial label="CLARITY" value={session.feedback.clarity_score} />
                          <ScoreDial label="TECHNICAL" value={session.feedback.technical_accuracy_score} />
                          <ScoreDial label="COMMUNICATION" value={session.feedback.communication_score} />
                        </div>

                        <div className="flex justify-center">
                          <span
                            className={cn(
                              "tag",
                              session.feedback.star_format_used ? "text-signal" : "text-caution"
                            )}
                          >
                            {session.feedback.star_format_used ? "★ STAR format used" : "△ STAR format not used"}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                          <div>
                            <p className="readout text-signal mb-2.5">WHAT WORKED</p>
                            <ul className="space-y-1.5">
                              {session.feedback.strengths.map((s, i) => (
                                <li key={i} className="text-[0.76rem] text-muted-foreground leading-relaxed flex gap-2">
                                  <span className="text-signal font-mono shrink-0">+</span>{s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="readout text-alert mb-2.5">WHAT TO IMPROVE</p>
                            <ul className="space-y-1.5">
                              {session.feedback.weaknesses.map((s, i) => (
                                <li key={i} className="text-[0.76rem] text-muted-foreground leading-relaxed flex gap-2">
                                  <span className="text-alert font-mono shrink-0">!</span>{s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="border border-ghost/30 bg-ghost/[0.04] p-4">
                          <p className="readout text-ghost mb-2">TIP</p>
                          <p className="text-[0.78rem] leading-relaxed text-foreground/90">{session.feedback.tip}</p>
                        </div>

                        <div>
                          <p className="readout mb-2">EXAMPLE OF A STRONGER ANSWER</p>
                          <div className="border border-border/70 bg-background/40 p-4 text-[0.76rem] text-muted-foreground leading-relaxed">
                            {session.feedback.improved_answer}
                          </div>
                        </div>
                      </div>
                    </Panel>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
