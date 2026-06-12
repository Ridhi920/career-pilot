import { CommandRail } from "@/components/ops/CommandRail";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pt-12">
      <CommandRail />
      <main className="max-w-[1500px] mx-auto">{children}</main>
    </div>
  );
}
