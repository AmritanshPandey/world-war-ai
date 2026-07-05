# SPOT THE HUMAN Implementation Plan

- Create `components/spot-the-human/` as a self-contained final game section.
- Add a server chapter wrapper at `components/chapters/SpotTheHumanChapter.tsx`.
- Replace the final game slot in `app/page.tsx` so the game appears before `ManifestoChapter`.
- Keep interaction, timers, scoring, hints, keyboard controls, and localStorage best-score persistence in `hooks/useSpotTheHumanGame.ts`.
- Render the crowd through one client-only React Three Fiber canvas using instanced silhouettes, the existing `HelicopterModel`, and existing grain/scanline CSS.
- Score each round with base points, remaining-time bonus, precision bonus, wrong-click penalties, and hint penalties. Final ranks come from `lib/scoring.ts`.
