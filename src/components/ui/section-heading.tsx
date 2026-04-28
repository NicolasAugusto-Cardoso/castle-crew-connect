import * as React from "react";
import { cn } from "@/lib/utils";
import { COLOR_THEMES, type ColorTheme } from "@/lib/colorThemes";

interface SectionHeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  colorTheme: ColorTheme;
  as?: "h1" | "h2" | "h3" | "h4";
  icon?: React.ReactNode;
}

const SIZE_BY_LEVEL: Record<NonNullable<SectionHeadingProps["as"]>, string> = {
  h1: "text-2xl xs:text-3xl sm:text-4xl",
  h2: "text-lg xs:text-xl sm:text-2xl",
  h3: "text-base xs:text-lg sm:text-xl",
  h4: "text-sm xs:text-base sm:text-lg",
};

/**
 * SectionHeading — colored subtitle for app sections.
 * Uses the section's fixed color from getSectionTheme(), applied as
 * text-{color}-300 over the dark background for WCAG AA contrast.
 */
export const SectionHeading = React.forwardRef<
  HTMLHeadingElement,
  SectionHeadingProps
>(({ className, colorTheme, as: Tag = "h2", icon, children, ...props }, ref) => {
  const t = COLOR_THEMES[colorTheme];
  return (
    <Tag
      ref={ref}
      className={cn(
        "font-bold tracking-tight inline-flex items-center gap-2",
        SIZE_BY_LEVEL[Tag],
        t.accent,
        // Glow nível 4/10: ícone com brilho sutil, texto nítido (sem text-shadow para evitar borrão).
        "[&>span:first-child]:drop-shadow-[0_0_3px_currentColor] [&>span:first-child]:opacity-95",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className={cn("flex-shrink-0", t.accent)}>{icon}</span>
      )}
      <span>{children}</span>
    </Tag>
  );
});
SectionHeading.displayName = "SectionHeading";
