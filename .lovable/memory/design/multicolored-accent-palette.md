---
name: Unified white accent palette
description: All sections now use a single white/silver neon accent (no per-tab colors)
type: design
---

The multicolor per-tab system (blue/yellow/red/green/purple/orange) was retired.
All sections map to `"white"` in `SECTION_THEME_MAP` (`src/lib/colorThemes.ts`).

- `--page-primary` always resolves to `var(--neon-white)` regardless of route.
- App stays in dark mode (background `0 0% 4%`); accents, borders, focus rings, tab indicators, card glows are all white/silver.
- Theme keys (blue/green/red/etc) remain in the type system for backward compatibility but should not be used for new section assignments.
- Bottom-nav active icons inherit the same white accent because they read `getRouteTheme(item.path)`.

If a future request reintroduces per-section colors, edit `SECTION_THEME_MAP` — do not fork the theme engine.
