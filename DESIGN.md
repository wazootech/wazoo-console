---
version: 1.0.0
name: Wazoo Console
derivedFrom: ../wazoo.dev/DESIGN.md
colors:
  primary: "#FF8C00"
  primary-light: "#FFB74D"
  primary-dark: "#F57C00"
  highlight: "#FFAA00"
  selection: "#846CE4"
  void: "#040404"
  surface: "#0F0F0F"
  surface-raised: "#141414"
  border: "#1A1A1A"
  text: "#B0B0B1"
  text-muted: "#7C7C7C"
  white: "#FFFFFF"
  danger: "#EF5350"
typography:
  fonts:
    body: "IBM Plex Mono, monospace"
    headings: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  scale:
    h1: "clamp(2.75rem, 8vw, 5.5rem)"
    h2: "1.5rem"
    body: "1.0625rem"
    caption: "0.875rem"
shapes:
  border-radius: "8px"
motion:
  timing:
    fast: "0.2s"
    normal: "0.3s"
---

# Wazoo Console Design System

The Console uses the core Wazoo identity with a denser application layout. It
should feel like an operator surface for managing Worlds, not a generic glassy
SaaS landing page.

## Principles

- Preserve Wazoo's dark, mechanical, developer-first identity.
- Use Sunset Orange for primary actions, links, active states, and focus rings.
- Use IBM Plex Mono for body copy, labels, inputs, buttons, and operational UI.
- Use Inter only for major headings and compact badge labels.
- Keep surfaces flat: subtle borders over heavy shadows, blur, or glassmorphism.
- Use `8px` radii for cards, inputs, and buttons. Do not use pills for standard controls.

## Console-Specific Adjustments

- Admin review cards can use tighter spacing than marketing pages.
- Forms should prioritize legibility and obvious focus states.
- Danger actions use red only for destructive/reject flows.
- Private beta copy may use larger hero typography, but it still follows Wazoo
  colors, mono body copy, and structured geometry.

## Do Not

- Do not use lime/cyan as primary brand accents.
- Do not use large glass panels, heavy blur, or soft neon gradients.
- Do not use pill-shaped CTAs or cards with radii greater than `12px`.
- Do not replace body typography with a generic sans-serif stack.
