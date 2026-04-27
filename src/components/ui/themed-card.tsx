import * as React from "react";
import { cn } from "@/lib/utils";
import { COLOR_THEMES, type ColorTheme } from "@/lib/colorThemes";

/**
 * CardThemed — neon-outline themed card.
 * Solid black background, vibrant colored border, glow on hover.
 */

interface CardThemedProps extends React.HTMLAttributes<HTMLDivElement> {
  colorTheme: ColorTheme;
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
          "rounded-2xl border text-card-foreground transition-all duration-300",
          t.card,
          t.border,
          !noHover && t.hoverBorder,
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
    className={cn("flex flex-col space-y-1.5 p-5", className)}
    {...props}
  />
));
CardThemedHeader.displayName = "CardThemedHeader";

interface CardThemedTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  colorTheme: ColorTheme;
  as?: "h2" | "h3" | "h4";
  /** When true, paint title in the theme color. Default: white. */
  colored?: boolean;
}

export const CardThemedTitle = React.forwardRef<
  HTMLHeadingElement,
  CardThemedTitleProps
>(({ className, colorTheme, colored = false, as: Tag = "h3", ...props }, ref) => {
  const t = COLOR_THEMES[colorTheme];
  return (
    <Tag
      ref={ref}
      className={cn(
        "text-base font-semibold leading-tight tracking-tight",
        colored ? t.accent : "text-foreground",
        className,
      )}
      {...props}
    />
  );
});
CardThemedTitle.displayName = "CardThemedTitle";

interface CardThemedAccentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  colorTheme: ColorTheme;
}

/** Big colored value (number/price) in the theme color. */
export const CardThemedAccent = React.forwardRef<
  HTMLDivElement,
  CardThemedAccentProps
>(({ className, colorTheme, ...props }, ref) => {
  const t = COLOR_THEMES[colorTheme];
  return (
    <div
      ref={ref}
      className={cn("text-3xl font-bold tracking-tight", t.accent, className)}
      {...props}
    />
  );
});
CardThemedAccent.displayName = "CardThemedAccent";

export const CardThemedContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-5 pt-0 text-slate-300", className)}
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
    className={cn("flex items-center p-5 pt-0 text-xs text-slate-500", className)}
    {...props}
  />
));
CardThemedFooter.displayName = "CardThemedFooter";
