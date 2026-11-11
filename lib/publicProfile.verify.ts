// Run: npx tsx lib/publicProfile.verify.ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PRIVATE_PROFILE_FIELDS,
  buildPublicVCard,
  canViewPrivateProfile,
  hasContactCard,
  profileForViewer,
  toPublicProfile,
} from './publicProfile';

let checks = 0;
const ok = (condition: unknown, message: string) => { assert.ok(condition, message); checks++; };

const LOGIN_EMAIL = 'private-login@example.com';
const PHONE = '404-555-0100';
const ADDRESS = '12 Secret St, Atlanta';
const fullUser = {
  _id: { toString: () => '64f000000000000000000001' },
  __v: 3,
  username: 'jane',
  name: 'Jane Boop',
  bio: 'Hi',
  profileImage: '/p.webp',
  backgroundImage: '/bg.webp',
  backgroundColor: '#0a0a0a',
  outerBackgroundColor: '#C4CFDA',
  innerBackgroundColor: '#ffffff',
  useThemeBackground: false,
  themeOverridesHero: true,
  themeId: 'boop-classic',
  fontId: 'boop',
  buttonStyle: 'solid',
  links: [{ _id: 'linkoid', id: 'l1', title: 'Site', url: 'https://x.test', isActive: true, clicks: 99, LNKimg: '', kind: 'video', tapUrl: 'https://v.test' }],
  socials: [{ _id: 'soid', id: 's1', platform: 'instagram', url: 'https://instagram.com/jane' }],
  instagram: '', tiktok: '', youtube: '', facebook: '',
  phone: PHONE,
  email: LOGIN_EMAIL,
  company: 'Easy Did It',
  title: 'Maker',
  address: ADDRESS,
  password: '$2a$10$hashhashhash',
  views: 12, contactSaves: 3, socialTaps: 4,
  daily: { '2026-11-10': { v: 1 } },
  createdAt: new Date('2026-01-01'),
  lastLogin: new Date('2026-11-10'),
};

// Public payload: allowlist only
const pub = toPublicProfile(fullUser) as unknown as Record<string, unknown>;
const pubJson = JSON.stringify(pub);
for (const field of PRIVATE_PROFILE_FIELDS) ok(!(field in pub), `public payload has no ${field}`);
for (const secret of [LOGIN_EMAIL, PHONE, ADDRESS, '$2a$10$', '64f000000000000000000001', 'linkoid', 'soid', '2026-11-10']) {
  ok(!pubJson.includes(secret), `public JSON never contains ${secret}`);
}
ok(!pubJson.includes('"clicks"'), 'link click counts stay private');
ok(pub.username === 'jane' && pub.name === 'Jane Boop' && pub.bio === 'Hi', 'display fields kept');
ok(pub.useThemeBackground === false && pub.themeOverridesHero === true, 'booleans kept');
const link = (pub.links as Record<string, unknown>[])[0];
ok(link.id === 'l1' && link.url === 'https://x.test' && link.kind === 'video' && link.tapUrl === 'https://v.test', 'links keep display fields');
ok((pub.socials as Record<string, unknown>[])[0].platform === 'instagram', 'socials kept');
ok(pub.hasContactCard === true, 'Add to Contacts flag set from owner contact fields');
const allowed = new Set(['username','name','bio','profileImage','backgroundImage','backgroundColor','outerBackgroundColor','innerBackgroundColor','useThemeBackground','themeOverridesHero','themeId','fontId','buttonStyle','instagram','tiktok','youtube','facebook','links','socials','hasContactCard']);
ok(Object.keys(pub).every((k) => allowed.has(k)), 'no keys beyond the allowlist');
ok(!hasContactCard({ email: LOGIN_EMAIL }), 'login email alone does not make a contact card');
ok(!hasContactCard(null), 'null user has no contact card');

// Who sees what
const asStranger = profileForViewer(fullUser, null) as Record<string, unknown>;
ok(!('email' in asStranger) && !('phone' in asStranger) && !('lastLogin' in asStranger), 'stranger (signed out) gets public only');
const asOtherUser = profileForViewer(fullUser, 'bob') as Record<string, unknown>;
ok(!('email' in asOtherUser) && !('address' in asOtherUser), 'another signed-in user gets public only');
const asOwner = profileForViewer(fullUser, 'Jane') as Record<string, unknown>;
ok(asOwner.email === LOGIN_EMAIL && asOwner.phone === PHONE && asOwner.address === ADDRESS && 'lastLogin' in asOwner, 'profile owner sees private fields');
ok(!('password' in asOwner), 'owner never gets the password hash');
for (const admin of ['peasy1', 'pez', 'easydidit']) {
  const view = profileForViewer(fullUser, admin) as Record<string, unknown>;
  ok(view.email === LOGIN_EMAIL && view.phone === PHONE && view.address === ADDRESS, `admin ${admin} sees private fields`);
  ok(!('password' in view), `admin ${admin} never gets the password hash`);
}
ok(!canViewPrivateProfile('', 'jane') && !canViewPrivateProfile(undefined, 'jane'), 'empty viewer is public');

// vCard: owner contact fields yes, login email never
const vcf = buildPublicVCard(fullUser);
ok(!vcf.includes(LOGIN_EMAIL) && !/EMAIL/i.test(vcf), 'vCard never includes the login email');
ok(vcf.includes(`TEL;TYPE=CELL:${PHONE}`), 'vCard keeps owner-entered phone');
ok(vcf.includes('ORG:Easy Did It') && vcf.includes('TITLE:Maker'), 'vCard keeps company and title');
ok(vcf.includes('ADR;TYPE=HOME:;;12 Secret St\\, Atlanta;;;;'), 'vCard keeps owner-entered address, escaped');
ok(!buildPublicVCard({ name: 'X\nEMAIL:evil@x.test' }).split('\n').some((l) => l.startsWith('EMAIL')), 'vCard values cannot inject lines');

// Wiring: every public surface goes through the allowlist; owner surfaces keep full data
const page = readFileSync(resolve('app/[username]/page.tsx'), 'utf8');
ok(page.includes('toPublicProfile(doc') && page.includes('<ClientPublicProfile user={user}'), 'public page passes only the allowlist to the client component');
const api = readFileSync(resolve('app/api/public-profile/[username]/route.ts'), 'utf8');
ok(api.includes('profileForViewer(') && api.includes('getSessionUsername(request)') && !api.includes('NextResponse.json(user)'), 'public API is viewer-aware');
const vroute = readFileSync(resolve('app/api/vcard/[username]/route.ts'), 'utf8');
ok(vroute.includes('buildPublicVCard(') && !vroute.includes('user.email') && !/select\([^)]*email/.test(vroute), 'vCard route never reads email');
const client = readFileSync(resolve('app/[username]/ClientPublicProfile.tsx'), 'utf8');
ok(!/user\??\.(email|phone|address|lastLogin)/.test(client), 'public client component reads no private fields');
const dash = readFileSync(resolve('app/dashboard/page.tsx'), 'utf8');
ok(dash.includes('toPublicProfile({'), 'dashboard preview matches the public view');
const me = readFileSync(resolve('app/api/me/route.ts'), 'utf8');
ok(me.includes('getSessionUsername(request)') && me.includes(".select('-password')"), 'owner /api/me still returns full record');
const admin = readFileSync(resolve('app/api/admin/users/route.ts'), 'utf8');
ok(admin.includes('isSessionAdmin(request)') && admin.includes('email') && admin.includes('lastLogin'), 'admin user list still returns email and lastLogin');

console.log(`publicProfile.verify: all ${checks} checks passed`);
