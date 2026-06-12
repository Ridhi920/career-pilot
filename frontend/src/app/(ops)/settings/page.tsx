"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ModuleHeader } from "@/components/ops/ModuleHeader";
import { Panel, PanelHeader, Lamp } from "@/components/ops/primitives";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const apiHost = API_URL.replace(/^https?:\/\//, "");

const THEMES = [
  {
    id: "horizon",
    name: "Horizon",
    desc: "Electric cyan on deep navy with pink and gold telemetry. The signature look.",
    bg: "#080C12",
    accent: "#53E0F5",
    panel: "#0D1220",
  },
  {
    id: "midnight",
    name: "Midnight",
    desc: "Clean ice blue on soft navy. No background effects, rounder corners — calm and simple.",
    bg: "#0D131F",
    accent: "#6FAFFA",
    panel: "#131C2B",
  },
  {
    id: "graphite",
    name: "Graphite",
    desc: "Neutral charcoal with a calm sage accent. The most minimal of the three.",
    bg: "#101113",
    accent: "#7FC9A4",
    panel: "#17181B",
  },
];

function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Panel hud>
      <PanelHeader label="THEME" />
      <div className="p-4 grid md:grid-cols-3 gap-3">
        {THEMES.map((t) => {
          const active = mounted && (theme ?? "horizon") === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "text-left border p-4 transition-all duration-200",
                active
                  ? "border-signal/70 bg-signal/5 shadow-glow-sm"
                  : "border-border/70 hover:border-signal/40"
              )}
            >
              {/* preview swatch */}
              <div
                className="h-16 mb-3 border border-border/60 relative overflow-hidden"
                style={{ background: t.bg }}
              >
                <div
                  className="absolute left-2 top-2 right-10 bottom-2 border"
                  style={{ background: t.panel, borderColor: `${t.accent}40` }}
                >
                  <div className="h-1.5 m-2 w-1/2" style={{ background: t.accent }} />
                  <div className="h-1 mx-2 w-3/4 opacity-30" style={{ background: "#9aa6b2" }} />
                  <div className="h-1 mx-2 mt-1 w-2/3 opacity-30" style={{ background: "#9aa6b2" }} />
                </div>
                <span
                  className="absolute right-2.5 top-2.5 w-2.5 h-2.5 rounded-full"
                  style={{ background: t.accent, boxShadow: `0 0 8px ${t.accent}` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[0.82rem] font-medium">{t.name}</p>
                {active && <span className="text-[0.64rem] text-signal font-medium">✓ Active</span>}
              </div>
              <p className="text-[0.68rem] text-muted-foreground mt-1 leading-relaxed">{t.desc}</p>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export default function SettingsPage() {
  return (
    <div className="px-4 lg:px-6 py-8 max-w-4xl">
      <ModuleHeader
        title="Settings"
        description="Appearance, system configuration and API access."
      />

      <div className="space-y-5">
        <ThemePicker />

        <Panel>
          <PanelHeader label="TECH STACK" />
          <div className="divide-y divide-border/60">
            {[
              { label: "AI MODEL", value: "Groq — Llama 3.3 70B", note: "Cloud / free tier", lamp: "text-data" },
              { label: "DATABASE", value: "PostgreSQL", note: "Self-hosted", lamp: "text-signal" },
              { label: "BACKEND", value: apiHost, note: "FastAPI", lamp: "text-caution" },
            ].map((row) => (
              <div key={row.label} className="px-4 py-3.5 flex items-center gap-4">
                <Lamp color={row.lamp} className="w-[5px] h-[5px]" />
                <span className="readout w-28 shrink-0">{row.label}</span>
                <span className="font-mono text-[0.74rem] flex-1">{row.value}</span>
                <span className="text-[0.62rem] text-muted-foreground">{row.note}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader label="ENVIRONMENT" />
          <div className="p-4">
            <p className="text-[0.78rem] text-muted-foreground mb-3 leading-relaxed">
              Configure via the <code className="font-mono text-data">.env</code> file in the backend directory.
            </p>
            <pre className="border border-border/60 bg-background/50 p-4 font-mono text-[0.7rem] leading-loose text-muted-foreground">
{`GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
DATABASE_URL=postgresql://...`}
            </pre>
          </div>
        </Panel>

        <Panel>
          <PanelHeader label="API DOCS" />
          <div className="p-4 flex flex-wrap gap-5 text-[0.76rem]">
            <a
              href={`${API_URL}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-signal hover:glow-text transition-all"
            >
              Swagger UI — {apiHost}/docs
            </a>
            <a
              href={`${API_URL}/redoc`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-signal hover:glow-text transition-all"
            >
              ReDoc — {apiHost}/redoc
            </a>
          </div>
        </Panel>
      </div>
    </div>
  );
}
