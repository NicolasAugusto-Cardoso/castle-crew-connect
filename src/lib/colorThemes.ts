/**
 * Multicolored "neon outline" accent palette layered on top of the dark theme.
 * Glow intensity reduced to ~level 4/10 — subtle, elegant, legible.
 *
 * Sincronização por aba (Apple-style):
 *   Home/Discipulado: Azul · Testemunhos: Amarelo · Bíblia: Vermelho
 *   Eventos: Verde · Contato: Roxo · Galeria: Laranja · Colaboradores: Branco
 */

export type ColorTheme =
  | "blue"
  | "purple"
  | "green"
  | "yellow"
  | "red"
  | "orange"
  | "white";

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

const mk = (name: string, hsl: string): ColorThemeTokens => ({
  card: "bg-[hsl(var(--neon-card))]",
  border: `border-${name}/55 shadow-[0_0_10px_-8px_hsl(var(${hsl})/0.35)]`,
  title: "text-foreground",
  hoverShadow: `hover:shadow-[0_0_14px_-6px_hsl(var(${hsl})/0.30)]`,
  hoverBorder: `hover:border-${name}`,
  ring: `focus-visible:ring-${name}`,
  accent: `text-${name}`,
  glowColor: `hsl(var(${hsl}) / 0.30)`,
});

export const COLOR_THEMES: Record<ColorTheme, ColorThemeTokens> = {
  blue: mk("neon-blue", "--neon-blue"),
  purple: mk("neon-purple", "--neon-purple"),
  green: mk("neon-green", "--neon-green"),
  yellow: mk("neon-yellow", "--neon-yellow"),
  red: mk("neon-red", "--neon-red"),
  orange: mk("neon-orange", "--neon-orange"),
  white: mk("neon-white", "--neon-white"),
};

export const THEME_ROTATION: ColorTheme[] = [
  "blue",
  "purple",
  "green",
  "yellow",
  "red",
  "orange",
];

export function getColorTheme(index: number): ColorTheme {
  const i = ((index % THEME_ROTATION.length) + THEME_ROTATION.length) %
    THEME_ROTATION.length;
  return THEME_ROTATION[i];
}

/**
 * Tema unificado: TODAS as seções usam o destaque branco/prata.
 * Mantemos as chaves de tema (blue/green/etc) para compatibilidade,
 * mas o mapeamento de seção sempre retorna "white".
 */
const SECTION_THEME_MAP: Record<string, ColorTheme> = {
  home: "white",
  events: "white",
  donations: "white",
  gallery: "white",
  testimonials: "white",
  bible: "white",
  contact: "white",
  discipleship: "white",
  collaborators: "white",
};

export function getSectionTheme(section: string): ColorTheme {
  return SECTION_THEME_MAP[section] ?? "blue";
}

/** Map a pathname like "/events/123" to the section theme. */
export function getRouteTheme(pathname: string): ColorTheme {
  const seg = pathname.replace(/^\/+/, "").split("/")[0] || "home";
  // path aliases
  const map: Record<string, string> = {
    "": "home",
    colaboradores: "collaborators",
    collaborator: "collaborators",
    events: "events",
    bible: "bible",
    contact: "contact",
    donations: "donations",
    gallery: "gallery",
    testimonials: "testimonials",
    discipleship: "discipleship",
  };
  return getSectionTheme(map[seg] ?? seg);
}

/** HSL CSS variable name for a theme (without `var()`). */
export const THEME_VAR: Record<ColorTheme, string> = {
  blue: "--neon-blue",
  purple: "--neon-purple",
  green: "--neon-green",
  yellow: "--neon-yellow",
  red: "--neon-red",
  orange: "--neon-orange",
  white: "--neon-white",
};

export type NeonButtonVariant =
  | "neonBlue"
  | "neonPurple"
  | "neonGreen"
  | "neonYellow"
  | "neonRed"
  | "neonOrange"
  | "neonWhite";

const NEON_VARIANT_MAP: Record<ColorTheme, NeonButtonVariant> = {
  blue: "neonBlue",
  purple: "neonPurple",
  green: "neonGreen",
  yellow: "neonYellow",
  red: "neonRed",
  orange: "neonOrange",
  white: "neonWhite",
};

export function getNeonVariant(theme: ColorTheme): NeonButtonVariant {
  return NEON_VARIANT_MAP[theme];
}
