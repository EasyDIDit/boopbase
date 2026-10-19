// Run: npx tsx lib/leads.verify.ts
import assert from 'node:assert/strict';
import { csvCell, EMAIL_CONSENT_TEXT, subscriberUpdate, leadsEnabled, leadsSecret, parseLeadBody, signLead, throttleKeys, verifyLeadSignature } from './leads';
import { signProvision } from './provision';

const secret = 'l'.repeat(40);
const ok = { name: 'Ada Boop', email: 'ADA@Example.com', phone: '', interests: ['stickers'], source: 'join-list', emailConsent: true, consentText: EMAIL_CONSENT_TEXT };
const raw = JSON.stringify(ok);
const ts = String(Date.now());
assert.ok(verifyLeadSignature(secret, raw, ts, signLead(secret, ts, raw)), 'valid signature');
assert.ok(!verifyLeadSignature(secret, raw + ' ', ts, signLead(secret, ts, raw)), 'tampered');
assert.ok(!verifyLeadSignature(secret, raw, ts, signProvision(secret, ts, raw)), 'provision signature cannot replay as a lead');
assert.ok(!verifyLeadSignature(secret, raw, String(Date.now() - 10 * 60_000), signLead(secret, String(Date.now() - 10 * 60_000), raw)), 'stale');
assert.equal(leadsEnabled({}), false);
assert.equal(leadsEnabled({ BOOP_LEADS_ENABLED: '1' }), false, 'only exact "true"');
assert.equal(leadsEnabled({ BOOP_LEADS_ENABLED: 'true' }), true);
assert.equal(leadsSecret({ BOOPBASE_LEADS_SECRET: 'short' }), null);
assert.equal(leadsSecret({ BOOPBASE_PROVISION_SECRET: 'p'.repeat(40) }), null, 'no fallback to provision secret');

const p = parseLeadBody(ok)!;
assert.equal(p.email, 'ada@example.com');
assert.equal(p.textConsent, false);
assert.deepEqual(parseLeadBody({ ...ok, phone: '404-555-0100', textConsent: true })!.textConsent, true);
assert.equal(parseLeadBody({ ...ok, phone: '', textConsent: true })!.textConsent, false, 'no phone → no text consent');
for (const bad of [
  { ...ok, name: '' }, { ...ok, name: 'x'.repeat(81) }, { ...ok, email: 'nope' }, { ...ok, email: `${'a'.repeat(250)}@b.co` },
  { ...ok, phone: 'call me' }, { ...ok, emailConsent: false }, { ...ok, consentText: 'yes' }, { ...ok, source: 'evil' },
  { ...ok, interests: ['hats'] }, { ...ok, interests: 'stickers' }, [], null, 'x',
]) assert.equal(parseLeadBody(bad), null, JSON.stringify(bad)?.slice(0, 60));
assert.equal(parseLeadBody({ ...ok, name: 'Ada\u0000\u0007 Boop' })!.name, 'Ada Boop', 'control chars stripped');

const u = subscriberUpdate(p, false);
assert.ok(!('isCustomer' in u.$set) && !('customerSince' in u.$set), 'a sign-up never clears the customer flag');
assert.equal(subscriberUpdate(p, true).$set.isCustomer, true, 'sign-up from a buyer flags customer');
assert.equal(u.$set.consentText, EMAIL_CONSENT_TEXT);
assert.equal(throttleKeys({ ...p, ipHash: 'a'.repeat(64) }).length, 2);
assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`, 'formula injection neutralised');
assert.equal(csvCell(['a', 'b']), '"a; b"');
console.log('leads.verify: all passed');
