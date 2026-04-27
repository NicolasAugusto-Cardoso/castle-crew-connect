import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-neon-blue/70 bg-neon-blue/10 text-neon-blue shadow-[0_0_18px_-8px_hsl(var(--neon-blue))] hover:bg-neon-blue/20 hover:border-neon-blue hover:shadow-[0_0_22px_-5px_hsl(var(--neon-blue)/0.75)] transition-all",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-neon-purple/70 bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 hover:border-neon-purple hover:shadow-[0_0_18px_-6px_hsl(var(--neon-purple)/0.65)] transition-all",
        secondary: "border border-neon-green/70 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 hover:border-neon-green hover:shadow-[0_0_18px_-6px_hsl(var(--neon-green)/0.65)] transition-all",
        ghost: "text-neon-blue hover:bg-neon-blue/10 hover:text-neon-blue hover:shadow-[0_0_14px_-7px_hsl(var(--neon-blue))] transition-all",
        link: "text-neon-blue underline-offset-4 hover:text-neon-purple hover:underline",
        // REFACTOR Dark Mode — Variante A (Clean): preto + borda prata sutil
        clean: "bg-background border border-white/10 text-foreground hover:bg-white/5 hover:border-white/20 transition-colors",
        // REFACTOR Dark Mode — Variante B (Destaque): gradiente prata/branco, texto escuro AAA
        premium: "bg-gradient-to-r from-[hsl(0,0%,95%)] to-[hsl(0,0%,78%)] text-[#121212] font-semibold border border-white/10 hover:brightness-105 hover:scale-[1.02] transition-all",
        // Neon outline variants — combinam com CardThemed (mesma paleta)
        neonBlue: "bg-neon-blue/10 border border-neon-blue/70 text-neon-blue hover:bg-neon-blue/20 hover:border-neon-blue hover:shadow-[0_0_16px_-4px_hsl(var(--neon-blue)/0.65)] transition-all",
        neonPurple: "bg-neon-purple/10 border border-neon-purple/70 text-neon-purple hover:bg-neon-purple/20 hover:border-neon-purple hover:shadow-[0_0_16px_-4px_hsl(var(--neon-purple)/0.65)] transition-all",
        neonGreen: "bg-neon-green/10 border border-neon-green/70 text-neon-green hover:bg-neon-green/20 hover:border-neon-green hover:shadow-[0_0_16px_-4px_hsl(var(--neon-green)/0.65)] transition-all",
        neonYellow: "bg-neon-yellow/10 border border-neon-yellow/70 text-neon-yellow hover:bg-neon-yellow/20 hover:border-neon-yellow hover:shadow-[0_0_16px_-4px_hsl(var(--neon-yellow)/0.65)] transition-all",
        neonRed: "bg-neon-red/10 border border-neon-red/70 text-neon-red hover:bg-neon-red/20 hover:border-neon-red hover:shadow-[0_0_16px_-4px_hsl(var(--neon-red)/0.65)] transition-all",
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
