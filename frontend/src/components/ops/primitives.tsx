"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { cn } from "@/lib/utils";

/* ============================================================
   MISSION OPS primitives — the entire interface is built from
   these five ideas: Panel, Readout, Lamp, Ticker, Gauge.
   ============================================================ */

/** Console panel — the single container of the system.
 *  `hud` is accepted for compatibility but no longer adds decoration. */
export function Panel({
  className,
  hud: _hud = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hud?: boolean }) {
  return (
    <div className={cn("panel", className)} {...props}>
      {children}
    </div>
  );
}

/** Panel header strip: "▸ LABEL ………………… [extra]" */
export function PanelHeader({
  label,
  extra,
  className,
}: {
  label: string;
  extra?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 h-9 border-b border-border/70",
        className
      )}
    >
      <span className="readout">{label}</span>
      {extra}
    </div>
  );
}

/** Indicator lamp with label. */
export function Lamp({
  color = "text-signal",
  pulse = false,
  className,
}: {
  color?: string;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("lamp", color, pulse && "animate-lamp-pulse", className)} />
  );
}

/** Animated number — counts up when scrolled into view or value changes. */
export function Ticker({
  value,
  suffix = "",
  decimals = 0,
  className,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const from = display;
    const dur = 900;
    let raf: number;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView]);

  return (
    <span ref={ref} className={cn("font-mono tabular-nums", className)}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function scoreColor(score: number) {
  if (score >= 80) return "text-signal";
  if (score >= 60) return "text-caution";
  return "text-alert";
}

export function scoreStroke(score: number) {
  if (score >= 80) return "hsl(var(--signal))";
  if (score >= 60) return "hsl(var(--caution))";
  return "hsl(var(--alert))";
}

/** Circular scanner gauge — segmented arc with phosphor glow. */
export function ScannerGauge({
  score,
  size = 168,
  label = "SCORE",
  sublabel,
}: {
  score: number;
  size?: number;
  label?: string;
  sublabel?: string;
}) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const segments = 40;
  const lit = Math.round((score / 100) * segments);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <div
      ref={ref}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
        {/* segmented ring */}
        {Array.from({ length: segments }).map((_, i) => {
          const on = i < lit;
          return (
            <circle
              key={i}
              cx="55"
              cy="55"
              r={r}
              fill="none"
              stroke={on ? scoreStroke(score) : "hsl(var(--border))"}
              strokeWidth={on ? 5 : 3}
              strokeDasharray={`${(c / segments) * 0.55} ${c - (c / segments) * 0.55}`}
              strokeDashoffset={-(c / segments) * i}
              style={{
                opacity: inView ? 1 : 0,
                transition: `opacity 0.4s ease ${i * 22}ms`,
              }}
            />
          );
        })}
        {/* inner tick ring */}
        <circle
          cx="55" cy="55" r={r - 9}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="0.75"
          strokeDasharray="1 5"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={cn("font-mono text-3xl font-semibold tabular-nums", scoreColor(score))}>
          <Ticker value={score} />
        </span>
        <span className="readout mt-1.5">{label}</span>
        {sublabel && (
          <span className="font-mono text-[0.6rem] text-muted-foreground/70 mt-0.5 uppercase tracking-widest">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

/** Slim labeled telemetry bar. */
export function TelemetryBar({
  label,
  value,
  color,
  detail,
}: {
  label: string;
  value: number;
  color?: string;
  detail?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  return (
    <div ref={ref}>
      <div className="flex items-baseline justify-between mb-1.5 gap-3">
        <span className="readout">{label}</span>
        <span className={cn("font-mono text-xs tabular-nums", color ?? scoreColor(value))}>
          {Math.round(value)}%
        </span>
      </div>
      <div className="h-[3px] bg-border/60 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-1000 ease-ops"
          style={{
            width: inView ? `${value}%` : "0%",
            background: color ? `currentColor` : scoreStroke(value),
          }}
        />
      </div>
      {detail && (
        <p className="text-[0.72rem] text-muted-foreground mt-1.5 leading-relaxed">{detail}</p>
      )}
    </div>
  );
}

/** Big stat readout block. */
export function StatReadout({
  label,
  value,
  suffix = "",
  color = "text-foreground",
  lamp,
}: {
  label: string;
  value: number;
  suffix?: string;
  color?: string;
  lamp?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="readout flex items-center gap-2">
        {lamp && <Lamp color={lamp} className="w-[5px] h-[5px]" />}
        {label}
      </span>
      <span className={cn("font-mono text-2xl font-medium tabular-nums leading-none", color)}>
        <Ticker value={value} suffix={suffix} />
      </span>
    </div>
  );
}

/** Empty-state transmission box. */
export function NoSignal({
  message,
  children,
  className,
}: {
  message: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6 gap-4",
        className
      )}
    >
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      {children}
    </div>
  );
}
