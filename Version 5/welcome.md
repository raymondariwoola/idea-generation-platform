# Welcome Page (Think Space)

This minimalist, futuristic welcome page introduces the platform with a strong brand moment while staying lightweight and isolated from the main app.

- Files added:
  - `welcome.html` — a standalone landing screen with a centered hero, subtle animated orbs, and a single "Click to enter" CTA to `index.html`.
  - `welcome.css` — scoped styles under `welcome-` classes and no global overrides; uses brand variables when present.
- Why this design:
  - Big, bold headline and gradient brand text highlight the platform name.
  - Subtle motion (reduced-motion aware) and glassmorphism accents keep it modern yet minimal.
  - No changes to existing files and no shared CSS collisions.

Usage
- Publish `welcome.html` at the site root (or set it as a homepage). The CTA links to `index.html`.
- Fonts use Inter; icons via Font Awesome (cdn). If corporate CDNs are required, update the link tags.
