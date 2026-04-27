/**
 * Multicolored "neon outline" accent palette layered on top of the dark theme.
 *
 * Visual reference: solid black card, vibrant 1px colored border, glow on hover.
 * - card bg:   solid #0A0A0A (matches app background)
 * - border:    vibrant -500 at 70% alpha
 * - title:     white/foreground (only accent values are colored)
 * - accent:    -400 (icons + headline numbers)
 * - hover:     subtle colored glow + border intensifies to -400
 */

export type ColorTheme = "blue" | "purple" | "green" | "yellow" | "red";

export interface ColorThemeTokens {
  card: string;
  border: string;
  title: string;
  hoverShadow: string;
  hoverBorder: string;
  ring: string;
  accent: string;
  glowColor: string;
}

export const COLOR_THEMES: Record<ColorTheme, ColorThemeTokens> = {
  blue: {
    card: "bg-[#0A0A0A]",
    border: "border-blue-500/70",
    title: "text-foreground",
    hoverShadow: "hover:shadow-[0_0_24px_-4px_rgba(59,130,246,0.55)]",
    hoverBorder: "hover:border-blue-400",
    ring: "focus-visible:ring-blue-400",
    accent: "text-blue-400",
    glowColor: "rgba(59,130,246,0.55)",
  },
  purple: {
    card: "bg-[#0A0A0A]",
    border: "border-purple-500/70",
    title: "text-foreground",
    hoverShadow: "hover:shadow-[0_0_24px_-4px_rgba(168,85,247,0.55)]",
    hoverBorder: "hover:border-purple-400",
    ring: "focus-visible:ring-purple-400",
    accent: "text-purple-400",
    glowColor: "rgba(168,85,247,0.55)",
  },
  green: {
    card: "bg-[#0A0A0A]",
    border: "border-emerald-500/70",
    title: "text-foreground",
    hoverShadow: "hover:shadow-[0_0_24px_-4px_rgba(16,185,129,0.55)]",
    hoverBorder: "hover:border-emerald-400",
    ring: "focus-visible:ring-emerald-400",
    accent: "text-emerald-400",
    glowColor: "rgba(16,185,129,0.55)",
  },
  yellow: {
    card: "bg-[#0A0A0A]",
    border: "border-amber-500/70",
    title: "text-foreground",
    hoverShadow: "hover:shadow-[0_0_24px_-4px_rgba(245,158,11,0.55)]",
    hoverBorder: "hover:border-amber-400",
    ring: "focus-visible:ring-amber-400",
    accent: "text-amber-400",
    glowColor: "rgba(245,158,11,0.55)",
  },
  red: {
    card: "bg-[#0A0A0A]",
    border: "border-rose-500/70",
    title: "text-foreground",
    hoverShadow: "hover:shadow-[0_0_24px_-4px_rgba(244,63,94,0.55)]",
    hoverBorder: "hover:border-rose-400",
    ring: "focus-visible:ring-rose-400",
    accent: "text-rose-400",
    glowColor: "rgba(244,63,94,0.55)",
  },
};

/** Circular rotation: blue → purple → green → yellow → red */
export const THEME_ROTATION: ColorTheme[] = [
  "blue",
  "purple",
  "green",
  "yellow",
  "red",
];

export function getColorTheme(index: number): ColorTheme {
  const i = ((index % THEME_ROTATION.length) + THEME_ROTATION.length) %
    THEME_ROTATION.length;
  return THEME_ROTATION[i];
}

const SECTION_THEME_MAP: Record<string, ColorTheme> = {
  home: "blue",
  events: "blue",
  donations: "green",
  gallery: "purple",
  testimonials: "yellow",
  bible: "red",
  contact: "blue",
  discipleship: "green",
  collaborators: "purple",
};

export function getSectionTheme(section: string): ColorTheme {
  return SECTION_THEME_MAP[section] ?? "blue";
}

/** Maps a color theme to the corresponding Button neon variant name. */
export type NeonButtonVariant =
  | "neonBlue"
  | "neonPurple"
  | "neonGreen"
  | "neonYellow"
  | "neonRed";

const NEON_VARIANT_MAP: Record<ColorTheme, NeonButtonVariant> = {
  blue: "neonBlue",
  purple: "neonPurple",
  green: "neonGreen",
  yellow: "neonYellow",
  red: "neonRed",
};

export function getNeonVariant(theme: ColorTheme): NeonButtonVariant {
  return NEON_VARIANT_MAP[theme];
}
