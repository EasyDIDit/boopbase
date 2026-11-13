/**
 * Public vs private profile data for BOOPbase.
 *
 * Anyone can open /{username}, /api/public-profile/{username} and the vCard,
 * so those must only ever carry an explicit allowlist of display fields.
 * The account/login email, password hash, lastLogin, internal ids and insight
 * counters stay private. Only the signed-in profile owner and the Boop
 * admin/owner accounts get the full record.
 */
import { isOwner, isAdminUsername } from './ownerAuth';
import type { SocialPlatformId } from './socialPlatforms';
import { isOfficialPaymentUrl, isPaymentPlatform } from './socialPlatforms';

type AnyRecord = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);

/** Display fields copied as-is (strings). Everything else is dropped. */
const PUBLIC_STRING_FIELDS = [
  'username',
  'name',
  'bio',
  'profileImage',
  'backgroundImage',
  'backgroundColor',
  'outerBackgroundColor',
  'innerBackgroundColor',
  'themeId',
  'fontId',
  'buttonStyle',
  // Legacy social URLs the owner typed for their public card
  'instagram',
  'tiktok',
  'youtube',
  'facebook',
] as const;

/** Private fields stripped even from the owner/admin view (token hashes are never sent to a browser). */
const SECRET_FIELDS = ['password', 'resetTokenHash', 'resetTokenExpires', 'emailVerifyTokenHash', 'emailVerifyExpires'] as const;

/**
 * Fields that must never appear in a public payload. `phone`, `address`,
 * `company` and `title` are owner-entered vCard fields: they are served only
 * inside the Add to Contacts file, never in the page/API JSON.
 * `email` is the login email (same field the dashboard edits), so it is
 * never public anywhere, including the vCard.
 */
export const PRIVATE_PROFILE_FIELDS = [
  '_id',
  '__v',
  'id',
  'email',
  'password',
  'resetTokenHash',
  'resetTokenExpires',
  'emailVerifyTokenHash',
  'emailVerifyExpires',
  'emailVerified',
  'passwordChangedAt',
  'phone',
  'address',
  'company',
  'title',
  'lastLogin',
  'createdAt',
  'views',
  'contactSaves',
  'socialTaps',
  'daily',
] as const;

export interface PublicLink {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  LNKimg: string;
  kind: 'link' | 'video';
  tapUrl: string;
}

export interface PublicSocial {
  id: string;
  platform: SocialPlatformId;
  url: string;
}

export interface PublicProfile {
  username: string;
  name: string;
  bio: string;
  profileImage: string;
  backgroundImage: string;
  backgroundColor: string;
  outerBackgroundColor: string;
  innerBackgroundColor: string;
  useThemeBackground: boolean;
  themeOverridesHero: boolean;
  themeId: string;
  fontId: string;
  buttonStyle: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  facebook: string;
  links: PublicLink[];
  socials: PublicSocial[];
  /** Owner-set public contact email ('' when not set or not opted in). Never the login email. */
  contactEmail: string;
  /** When true and contactEmail is set, the public page shows an email icon. */
  showContactEmail: boolean;
  /** True when the vCard has something worth saving (shows Add to Contacts). */
  hasContactCard: boolean;
}

/** Public contact email if the owner set a valid one, else ''. */
export function publicContactEmail(user: AnyRecord | null | undefined): string {
  const v = str(user?.contactEmail).trim().toLowerCase();
  return v.length <= 254 && /^[^\s@<>"(),;:]+@[^\s@<>"(),;:]+\.[a-z]{2,24}$/i.test(v) ? v : '';
}

/** vCard has content beyond the name. The login email is excluded; the public contact email counts. */
export function hasContactCard(user: AnyRecord | null | undefined): boolean {
  if (!user) return false;
  return ['phone', 'company', 'title', 'address'].some((k) => str(user[k]).trim() !== '') || publicContactEmail(user) !== '';
}

/** Explicit allowlist serializer for anything a stranger can see. */
export function toPublicProfile(user: AnyRecord): PublicProfile {
  const out: AnyRecord = {};
  for (const key of PUBLIC_STRING_FIELDS) out[key] = str(user[key]);
  out.useThemeBackground = bool(user.useThemeBackground, true);
  out.themeOverridesHero = bool(user.themeOverridesHero, false);

  const links = Array.isArray(user.links) ? (user.links as AnyRecord[]) : [];
  out.links = links.filter(Boolean).map((l): PublicLink => ({
    id: str(l.id),
    title: str(l.title),
    url: str(l.url),
    isActive: bool(l.isActive, true),
    LNKimg: str(l.LNKimg),
    kind: l.kind === 'video' ? 'video' : 'link',
    tapUrl: str(l.tapUrl),
  }));

  const socials = Array.isArray(user.socials) ? (user.socials as AnyRecord[]) : [];
  out.socials = socials.filter(Boolean).map((s): PublicSocial => ({
    id: str(s.id),
    platform: str(s.platform) as SocialPlatformId,
    url: str(s.url),
  })).filter((s) => !isPaymentPlatform(s.platform) || isOfficialPaymentUrl(s.platform, s.url));

  out.showContactEmail = bool(user.showContactEmail, false);
  // Page/API JSON only includes the address when the owner opts in. The vCard still uses it whenever it is set.
  out.contactEmail = out.showContactEmail ? publicContactEmail(user) : '';
  out.hasContactCard = hasContactCard(user);
  return out as unknown as PublicProfile;
}

/** Full record for the owner/admin, minus the password hash. */
export function toPrivateProfile(user: AnyRecord): AnyRecord {
  const rest = { ...user };
  for (const k of SECRET_FIELDS) delete rest[k];
  return rest;
}

/** Signed-in profile owner, or a Boop admin/owner account. */
export function canViewPrivateProfile(viewer: string | null | undefined, profileUsername: string): boolean {
  if (!viewer) return false;
  const v = viewer.toLowerCase();
  return v === profileUsername.toLowerCase() || isOwner(v) || isAdminUsername(v);
}

export function profileForViewer(user: AnyRecord, viewer: string | null | undefined) {
  return canViewPrivateProfile(viewer, str(user.username)) ? toPrivateProfile(user) : toPublicProfile(user);
}

const vcardEscape = (v: string) =>
  v.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

/** Public Add to Contacts file: only owner-entered contact fields (incl. public contact email), never the login email. */
export function buildPublicVCard(user: AnyRecord): string {
  const name = vcardEscape(str(user.name));
  const phone = str(user.phone).trim();
  const company = str(user.company).trim();
  const title = str(user.title).trim();
  const address = str(user.address).trim();
  const contactEmail = publicContactEmail(user);
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    `N:${name};;;;`,
    phone ? `TEL;TYPE=CELL:${vcardEscape(phone)}` : '',
    contactEmail ? `EMAIL;TYPE=INTERNET:${vcardEscape(contactEmail)}` : '',
    company ? `ORG:${vcardEscape(company)}` : '',
    title ? `TITLE:${vcardEscape(title)}` : '',
    address ? `ADR;TYPE=HOME:;;${vcardEscape(address)};;;;` : '',
    'END:VCARD',
  ].filter(Boolean).join('\n');
}
