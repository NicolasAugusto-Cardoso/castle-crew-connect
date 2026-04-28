import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Dark input — focus ring uses the page-contextual color
          "flex h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-base text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--page-primary,var(--neon-blue))/0.6)] focus-visible:ring-offset-0 focus-visible:border-[hsl(var(--page-primary,var(--neon-blue))/0.55)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
