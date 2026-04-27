import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-white/10 bg-transparent text-foreground hover:bg-white/5 hover:border-white/20",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-white/5 hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        // REFACTOR Dark Mode — Variante A (Clean): preto + borda prata sutil
        clean: "bg-background border border-white/10 text-foreground hover:bg-white/5 hover:border-white/20 transition-colors",
        // REFACTOR Dark Mode — Variante B (Destaque): gradiente prata/branco, texto escuro AAA
        premium: "bg-gradient-to-r from-[hsl(0,0%,95%)] to-[hsl(0,0%,78%)] text-[#121212] font-semibold border border-white/10 hover:brightness-105 hover:scale-[1.02] transition-all",
        // Neon outline variants — combinam com CardThemed (mesma paleta)
        neonBlue: "bg-transparent border border-blue-500/70 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 hover:shadow-[0_0_16px_-4px_rgba(59,130,246,0.5)] transition-all",
        neonPurple: "bg-transparent border border-purple-500/70 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 hover:shadow-[0_0_16px_-4px_rgba(168,85,247,0.5)] transition-all",
        neonGreen: "bg-transparent border border-emerald-500/70 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400 hover:shadow-[0_0_16px_-4px_rgba(16,185,129,0.5)] transition-all",
        neonYellow: "bg-transparent border border-amber-500/70 text-amber-400 hover:bg-amber-500/10 hover:border-amber-400 hover:shadow-[0_0_16px_-4px_rgba(245,158,11,0.5)] transition-all",
        neonRed: "bg-transparent border border-rose-500/70 text-rose-400 hover:bg-rose-500/10 hover:border-rose-400 hover:shadow-[0_0_16px_-4px_rgba(244,63,94,0.5)] transition-all",
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
