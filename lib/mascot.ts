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
