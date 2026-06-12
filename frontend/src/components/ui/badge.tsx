import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[2px] border px-2 py-0.5 font-mono text-[0.64rem] uppercase tracking-[0.1em] transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-command/60 bg-command/10 text-command",
        secondary: "border-border bg-secondary text-muted-foreground",
        destructive: "border-alert/60 bg-alert/10 text-alert",
        outline: "border-border text-foreground",
        success: "border-radar/60 bg-radar/10 text-radar",
        warning: "border-caution/60 bg-caution/10 text-caution",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
