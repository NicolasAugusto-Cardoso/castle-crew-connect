import * as React from "react";
import { cn } from "@/lib/utils";
import { COLOR_THEMES, type ColorTheme } from "@/lib/colorThemes";

/**
 * CardThemed — opt-in colorful wrapper around shadcn Card.
 * Applies the multicolored Variant A (dark-adapted) palette while
 * remaining fully prop-compatible with <Card>.
 *
 * Use <CardThemed colorTheme={getColorTheme(index)}> in grids/lists
 * to get circular blue → purple → green → yellow → red rotation.
 */

interface CardThemedProps extends React.HTMLAttributes<HTMLDivElement> {
  colorTheme: ColorTheme;
  /** Disable hover background intensification (e.g., non-clickable cards) */
  noHover?: boolean;
}

export const CardThemed = React.forwardRef<HTMLDivElement, CardThemedProps>(
  ({ className, colorTheme, noHover = false, ...props }, ref) => {
    const t = COLOR_THEMES[colorTheme];
    return (
      <div
        ref={ref}
        data-color-theme={colorTheme}
        className={cn(
          "rounded-2xl border-2 text-card-foreground transition-all duration-300",
          t.card,
          t.border,
          !noHover && t.hoverBg,
          !noHover && t.hoverShadow,
          className,
        )}
        {...props}
      />
    );
  },
);
CardThemed.displayName = "CardThemed";

export const CardThemedHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardThemedHeader.displayName = "CardThemedHeader";

interface CardThemedTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  colorTheme: ColorTheme;
  as?: "h2" | "h3" | "h4";
}

export const CardThemedTitle = React.forwardRef<
  HTMLHeadingElement,
  CardThemedTitleProps
>(({ className, colorTheme, as: Tag = "h3", ...props }, ref) => {
  const t = COLOR_THEMES[colorTheme];
  return (
    <Tag
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-tight tracking-tight",
        t.title,
        className,
      )}
      {...props}
    />
  );
});
CardThemedTitle.displayName = "CardThemedTitle";

export const CardThemedContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 pt-0 text-slate-300", className)}
    {...props}
  />
));
CardThemedContent.displayName = "CardThemedContent";

export const CardThemedFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardThemedFooter.displayName = "CardThemedFooter";
