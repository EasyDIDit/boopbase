export type MascotPose = '1-pointing' | '2-phone-card' | '3-waving' | '4-thumbs-up' | '5-peeking';

/** The approved drawn style is fixed; URL parameters cannot change it. */
export function mascotSrc(pose: MascotPose): string {
  return `/mascots/poses/clean/panther-drawn-${pose}.webp`;
}

export function profileSetupComplete({ photo, name, bio, socials, links }: {
  photo: string | null; name: string; bio: string; socials: readonly unknown[]; links: readonly unknown[];
}): boolean {
  return !!photo && !!name.trim() && !!bio.trim() && socials.length > 0 && links.length > 0;
}

/** Peeking-over-the-edge variants. `grip` is the share of the art below the paw line. */
export const PEEK_EXPRESSIONS = {
  shock: { width: 360, height: 358, grip: 0.154 },
  grin: { width: 360, height: 338, grip: 0.112 },
  wink: { width: 360, height: 324, grip: 0.108 },
  tongue: { width: 360, height: 325, grip: 0.138 },
  gasp: { width: 360, height: 352, grip: 0.06 },
  think: { width: 300, height: 360, grip: 0.078 },
} as const;
export type PeekExpression = keyof typeof PEEK_EXPRESSIONS;

/** Start-here reacts to progress: empty shock, building grin, almost-there gasp. */
export function startHereExpression(doneCount: number): PeekExpression {
  if (doneCount === 0) return 'shock';
  if (doneCount >= 4) return 'gasp';
  return 'grin';
}
