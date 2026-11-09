# Boop skins

## Version 1 (git tag `skins-v1`)
Boop Classic, Jazz Night, Night City, Pink Cabaret, Soda Sky, Butter Cream, Ink Noir, Mint Soda, Ruby Lounge, Paper Kraft.

## How a skin is built
1. `lib/skins.ts`: a `SKIN_REGISTRY` entry with id, name, description, colors (`tokens`), art (`assets`) and `flags`.
2. `lib/themes.ts`: a matching entry (same id) with button, Add to Contacts and social icon classes.
3. `public/skins/<id>/`: art named `page-bg`, `hero`, and optionally `link-frame` and `profile-frame` (SVG or transparent PNG/WebP).
4. Ring and link frames can come from a preset in `lib/skinFrames.ts` (`FRAME_PRESETS`).

The editor picker lists every `SKIN_REGISTRY` entry automatically.

## Version 2
- New optional mascot layer: `assets.mascot = { src?, emoji?, position, size? }`.
  `position` is `top-left`, `top-right`, `bottom-left`, `bottom-right`, or `profile` (beside the profile photo).
  It is decorative only (no taps, hidden from screen readers). Use a transparent PNG or SVG for `src`.
- Boop Classic uses the panther head as its default profile placeholder, without an emoji badge.
- New skins: Easy Did It (partner skin) and A-Town (A-Town Collection art).
