import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm font-mono uppercase tracking-[0.14em] text-[0.72rem] font-medium transition-all duration-200 ease-ops focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 ring-offset-background disabled:pointer-events-none disabled:opacity-40 active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "bg-signal text-primary-foreground border border-signal hover:shadow-glow hover:brightness-110",
        destructive:
          "bg-alert/10 text-alert border border-alert/50 hover:bg-alert/20 hover:border-alert hover:shadow-glow-alert",
        outline:
          "border border-border bg-card/60 text-foreground hover:border-signal/60 hover:text-signal",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-accent hover:border-signal/30",
        ghost: "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        link: "text-signal underline-offset-4 hover:underline tracking-normal",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-2.5 text-[0.66rem]",
        lg: "h-12 px-8 text-[0.8rem]",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
