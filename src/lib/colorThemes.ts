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
    card: "bg-[hsl(var(--neon-card))]",
    border: "border-neon-blue/70 shadow-[0_0_18px_-10px_hsl(var(--neon-blue))]",
    title: "text-foreground",
    hoverShadow: "hover:shadow-[0_0_24px_-4px_hsl(var(--neon-blue)/0.55)]",
    hoverBorder: "hover:border-neon-blue",
    ring: "focus-visible:ring-neon-blue",
    accent: "text-neon-blue",
    glowColor: "hsl(var(--neon-blue) / 0.55)",
  },
  purple: {
    card: "bg-[hsl(var(--neon-card))]",
    border: "border-neon-purple/70 shadow-[0_0_18px_-10px_hsl(var(--neon-purple))]",
    title: "text-foreground",
    hoverShadow: "hover:shadow-[0_0_24px_-4px_hsl(var(--neon-purple)/0.55)]",
    hoverBorder: "hover:border-neon-purple",
    ring: "focus-visible:ring-neon-purple",
    accent: "text-neon-purple",
    glowColor: "hsl(var(--neon-purple) / 0.55)",
  },
  green: {
    card: "bg-[hsl(var(--neon-card))]",
    border: "border-neon-green/70 shadow-[0_0_18px_-10px_hsl(var(--neon-green))]",
    title: "text-foreground",
    hoverShadow: "hover:shadow-[0_0_24px_-4px_hsl(var(--neon-green)/0.55)]",
    hoverBorder: "hover:border-neon-green",
    ring: "focus-visible:ring-neon-green",
    accent: "text-neon-green",
    glowColor: "hsl(var(--neon-green) / 0.55)",
  },
  yellow: {
    card: "bg-[hsl(var(--neon-card))]",
    border: "border-neon-yellow/70 shadow-[0_0_18px_-10px_hsl(var(--neon-yellow))]",
    title: "text-foreground",
    hoverShadow: "hover:shadow-[0_0_24px_-4px_hsl(var(--neon-yellow)/0.55)]",
    hoverBorder: "hover:border-neon-yellow",
    ring: "focus-visible:ring-neon-yellow",
    accent: "text-neon-yellow",
    glowColor: "hsl(var(--neon-yellow) / 0.55)",
  },
  red: {
    card: "bg-[hsl(var(--neon-card))]",
    border: "border-neon-red/70 shadow-[0_0_18px_-10px_hsl(var(--neon-red))]",
    title: "text-foreground",
    hoverShadow: "hover:shadow-[0_0_24px_-4px_hsl(var(--neon-red)/0.55)]",
    hoverBorder: "hover:border-neon-red",
    ring: "focus-visible:ring-neon-red",
    accent: "text-neon-red",
    glowColor: "hsl(var(--neon-red) / 0.55)",
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
