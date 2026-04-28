import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Glow level ~4/10 — subtle. Default variant inherits from --page-primary so each
// route gets a consistent CTA color. Specific neonX variants stay available for
// intentional accents inside cards.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--page-primary,var(--neon-blue)))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-[hsl(var(--page-primary,var(--neon-blue))/0.55)] bg-[hsl(var(--page-primary,var(--neon-blue))/0.10)] text-[hsl(var(--page-primary,var(--neon-blue)))] hover:bg-[hsl(var(--page-primary,var(--neon-blue))/0.18)] hover:border-[hsl(var(--page-primary,var(--neon-blue)))] hover:shadow-[0_0_12px_-6px_hsl(var(--page-primary,var(--neon-blue))/0.35)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-[hsl(var(--page-primary,var(--neon-blue))/0.45)] bg-transparent text-[hsl(var(--page-primary,var(--neon-blue)))] hover:bg-[hsl(var(--page-primary,var(--neon-blue))/0.10)] hover:border-[hsl(var(--page-primary,var(--neon-blue)))] hover:shadow-[0_0_10px_-6px_hsl(var(--page-primary,var(--neon-blue))/0.30)]",
        secondary:
          "border border-neon-green/55 bg-neon-green/10 text-neon-green hover:bg-neon-green/18 hover:border-neon-green hover:shadow-[0_0_12px_-6px_hsl(var(--neon-green)/0.35)]",
        ghost:
          "text-[hsl(var(--page-primary,var(--neon-blue)))] hover:bg-[hsl(var(--page-primary,var(--neon-blue))/0.10)]",
        link: "text-[hsl(var(--page-primary,var(--neon-blue)))] underline-offset-4 hover:underline",
        clean: "bg-background border border-white/10 text-foreground hover:bg-white/5 hover:border-white/20",
        premium:
          "bg-gradient-to-r from-[hsl(0,0%,95%)] to-[hsl(0,0%,78%)] text-[#121212] font-semibold border border-white/10 hover:brightness-105 hover:scale-[1.02]",
        // Per-color neon variants — softened to ~level 4 glow
        neonBlue:
          "bg-neon-blue/10 border border-neon-blue/55 text-neon-blue hover:bg-neon-blue/18 hover:border-neon-blue hover:shadow-[0_0_12px_-6px_hsl(var(--neon-blue)/0.35)]",
        neonPurple:
          "bg-neon-purple/10 border border-neon-purple/55 text-neon-purple hover:bg-neon-purple/18 hover:border-neon-purple hover:shadow-[0_0_12px_-6px_hsl(var(--neon-purple)/0.35)]",
        neonGreen:
          "bg-neon-green/10 border border-neon-green/55 text-neon-green hover:bg-neon-green/18 hover:border-neon-green hover:shadow-[0_0_12px_-6px_hsl(var(--neon-green)/0.35)]",
        neonYellow:
          "bg-neon-yellow/10 border border-neon-yellow/55 text-neon-yellow hover:bg-neon-yellow/18 hover:border-neon-yellow hover:shadow-[0_0_12px_-6px_hsl(var(--neon-yellow)/0.35)]",
        neonRed:
          "bg-neon-red/10 border border-neon-red/55 text-neon-red hover:bg-neon-red/18 hover:border-neon-red hover:shadow-[0_0_12px_-6px_hsl(var(--neon-red)/0.35)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
