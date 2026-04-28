import * as React from "react";

import { COLOR_THEMES, getColorTheme, type ColorTheme } from "@/lib/colorThemes";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  colorTheme?: ColorTheme;
  noHover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, colorTheme, noHover = false, ...props }, ref) => {
  const t = COLOR_THEMES[colorTheme ?? getColorTheme(0)];
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border bg-[hsl(var(--neon-card))] text-card-foreground transition-all duration-300",
        // contextual color: uses --page-primary when defined, falls back to theme
        "border-[hsl(var(--page-primary,var(--neon-blue))/0.45)] shadow-[0_0_10px_-8px_hsl(var(--page-primary,var(--neon-blue))/0.30)]",
        colorTheme && t.border,
        !noHover && (colorTheme ? t.hoverBorder : "hover:border-[hsl(var(--page-primary,var(--neon-blue))/0.75)]"),
        !noHover && (colorTheme ? t.hoverShadow : "hover:shadow-[0_0_14px_-6px_hsl(var(--page-primary,var(--neon-blue))/0.30)]"),
        className,
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight text-foreground", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-slate-300", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
