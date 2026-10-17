// Run: npx tsx lib/provision.verify.ts
import assert from 'node:assert/strict';
import {
  claimTokenFor, hashClaimToken, normalizeColor, REMINDER_DAYS, reminderDue, signNotify, maySignedInUserClaim, parseProvisionBody, provisionSecret, signProvision, verifyProvisionSignature,
} from './provision';

const secret = 'x'.repeat(40);
const body = JSON.stringify({ orderId: 'cs_test_abc123', email: 'A@B.co' });
const ts = String(Math.floor(Date.now() / 1000));
const sig = signProvision(secret, ts, body);
assert.ok(verifyProvisionSignature(secret, body, ts, sig));
assert.ok(!verifyProvisionSignature(secret, body + ' ', ts, sig), 'tampered body');
assert.ok(!verifyProvisionSignature('y'.repeat(40), body, ts, sig), 'wrong secret');
assert.ok(!verifyProvisionSignature(secret, body, String(Number(ts) - 600), signProvision(secret, String(Number(ts) - 600), body)), 'stale');
assert.ok(!verifyProvisionSignature(secret, body, null, sig) && !verifyProvisionSignature(secret, body, ts, 'zz'));
assert.equal(provisionSecret({}), null);
assert.equal(provisionSecret({ BOOPBASE_PROVISION_SECRET: 'short' }), null, 'too short → disabled');
const t1 = claimTokenFor(secret, 'cs_1', 'salt');
assert.equal(t1, claimTokenFor(secret, 'cs_1', 'salt'), 'deterministic');
assert.notEqual(t1, claimTokenFor(secret, 'cs_1', 'salt2'));
assert.match(hashClaimToken(t1), /^[0-9a-f]{64}$/);
assert.deepEqual(parseProvisionBody({ orderId: 'cs_test_abc123', email: 'A@B.co', quantity: 2 }), {
  orderId: 'cs_test_abc123', email: 'a@b.co', name: '', productType: 'card', quantity: 2, livemode: false, lines: [{ color: '', quantity: 2, custom: false }],
});
for (const bad of [{}, { orderId: 'x', email: 'a@b.co' }, { orderId: 'cs_test_1', email: 'nope' }, { orderId: 'cs_test_1', email: 'a@b.co', quantity: 0 }, { orderId: 'cs_test_1', email: 'a@b.co', productType: 'hat' }]) {
  assert.equal(parseProvisionBody(bad), null, JSON.stringify(bad));
}
// Tap-to-claim rules
assert.ok(maySignedInUserClaim({ status: 'ready' }, { email: 'x@y.z' }), 'ready: anyone');
assert.ok(maySignedInUserClaim({ status: 'sold', orderEmail: 'buyer@x.co' }, { email: 'BUYER@x.co' }), 'sold: matching email');
assert.ok(!maySignedInUserClaim({ status: 'sold', orderEmail: 'buyer@x.co' }, { email: 'other@x.co' }), 'sold: stranger blocked');
assert.ok(maySignedInUserClaim({ status: 'sold', orderEmail: '' }, {}), 'sold without email: open');
assert.ok(!maySignedInUserClaim({ status: 'claimed' }, {}) && !maySignedInUserClaim({ status: 'disabled' }, {}));
const D = 86400000, sold = new Date(0);
const dev = (n: number, extra = {}) => ({ status: 'sold', orderEmail: 'b@x.co', soldAt: sold, remindersSent: n, ...extra });
assert.ok(!reminderDue(dev(0), 6 * D) && reminderDue(dev(0), 7 * D), 'first at day 7');
assert.ok(!reminderDue(dev(1), 17 * D) && reminderDue(dev(1), 18 * D), 'second at day 18');
assert.ok(!reminderDue(dev(2), 24 * D) && reminderDue(dev(2), 25 * D), 'third at day 25');
assert.ok(!reminderDue(dev(3), 28 * D) && reminderDue(dev(3), 29 * D), 'fourth at day 29 (before the 30-day link expiry)');
assert.ok(!reminderDue(dev(4), 400 * D), 'max 4');
assert.deepEqual([...REMINDER_DAYS], [7, 18, 25, 29]);
assert.ok(REMINDER_DAYS.every((d) => d < 30), 'all reminders inside the 30-day link window');

// Per-color lines
const pl = parseProvisionBody({ orderId: 'cs_test_lines1', email: 'a@b.co', quantity: 3, lines: [{ color: 'Black', quantity: 2 }, { color: 'white', quantity: 1, custom: true }] });
assert.deepEqual(pl?.lines, [{ color: 'black', quantity: 2, custom: false }, { color: 'white', quantity: 1, custom: true }]);
assert.deepEqual(parseProvisionBody({ orderId: 'cs_test_lines2', email: 'a@b.co', quantity: 2 })?.lines, [{ color: '', quantity: 2, custom: false }], 'older callers: one any-color line');
assert.equal(parseProvisionBody({ orderId: 'cs_test_lines3', email: 'a@b.co', quantity: 3, lines: [{ color: 'black', quantity: 2 }] }), null, 'lines must add up');
assert.equal(parseProvisionBody({ orderId: 'cs_test_lines4', email: 'a@b.co', quantity: 1, lines: [{ color: 'red', quantity: 1 }] }), null, 'unknown color');
assert.equal(parseProvisionBody({ orderId: 'cs_test_lines5', email: 'a@b.co', quantity: 1, lines: [] }), null);
assert.equal(normalizeColor(' WHITE '), 'white');
assert.ok(!reminderDue(dev(0, { ownerUsername: 'x' }), 30 * D) && !reminderDue(dev(0, { status: 'claimed' }), 30 * D), 'stop once claimed');
assert.notEqual(signNotify(secret, ts, body), signProvision(secret, ts, body), 'notify signature domain-separated');
console.log('provision.verify: all checks passed');
