/**
 * Multicolored accent palette layered on top of the dark theme.
 * Variant A (Clean & Soft) adapted for dark background:
 *   - card bg: translucent pastel-dark
 *   - border: vibrant -400 at 40% alpha (border-2)
 *   - title: vibrant -300 (good contrast on #0A0A0A, WCAG AA)
 *   - hover: slightly stronger bg + colored shadow
 *
 * Body/paragraph text stays neutral (text-slate-300 / text-muted-foreground)
 * for visual rest as required by the spec.
 */

export type ColorTheme = "blue" | "purple" | "green" | "yellow" | "red";

export interface ColorThemeTokens {
  /** Card background (translucent pastel-dark) */
  card: string;
  /** Card border (vibrant) — pair with `border-2` */
  border: string;
  /** Section/card title color */
  title: string;
  /** Hover background intensification */
  hoverBg: string;
  /** Hover colored shadow */
  hoverShadow: string;
  /** Focus ring color */
  ring: string;
  /** Solid accent (icons, badges) */
  accent: string;
}

export const COLOR_THEMES: Record<ColorTheme, ColorThemeTokens> = {
  blue: {
    card: "bg-blue-500/10",
    border: "border-blue-400/40",
    title: "text-blue-300",
    hoverBg: "hover:bg-blue-500/15",
    hoverShadow: "hover:shadow-lg hover:shadow-blue-500/20",
    ring: "focus-visible:ring-blue-400",
    accent: "text-blue-400",
  },
  purple: {
    card: "bg-purple-500/10",
    border: "border-purple-400/40",
    title: "text-purple-300",
    hoverBg: "hover:bg-purple-500/15",
    hoverShadow: "hover:shadow-lg hover:shadow-purple-500/20",
    ring: "focus-visible:ring-purple-400",
    accent: "text-purple-400",
  },
  green: {
    card: "bg-emerald-500/10",
    border: "border-emerald-400/40",
    title: "text-emerald-300",
    hoverBg: "hover:bg-emerald-500/15",
    hoverShadow: "hover:shadow-lg hover:shadow-emerald-500/20",
    ring: "focus-visible:ring-emerald-400",
    accent: "text-emerald-400",
  },
  yellow: {
    card: "bg-amber-500/10",
    border: "border-amber-400/40",
    title: "text-amber-300",
    hoverBg: "hover:bg-amber-500/15",
    hoverShadow: "hover:shadow-lg hover:shadow-amber-500/20",
    ring: "focus-visible:ring-amber-400",
    accent: "text-amber-400",
  },
  red: {
    card: "bg-rose-500/10",
    border: "border-rose-400/40",
    title: "text-rose-300",
    hoverBg: "hover:bg-rose-500/15",
    hoverShadow: "hover:shadow-lg hover:shadow-rose-500/20",
    ring: "focus-visible:ring-rose-400",
    accent: "text-rose-400",
  },
};

/** Circular rotation order: blue → purple → green → yellow → red */
export const THEME_ROTATION: ColorTheme[] = [
  "blue",
  "purple",
  "green",
  "yellow",
  "red",
];

/** Pick a theme by index (mod 5) for grids/lists. */
export function getColorTheme(index: number): ColorTheme {
  const i = ((index % THEME_ROTATION.length) + THEME_ROTATION.length) %
    THEME_ROTATION.length;
  return THEME_ROTATION[i];
}

/** Fixed color per app section/route for section headings. */
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
