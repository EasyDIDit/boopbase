// Run: npx tsx lib/provision.verify.ts
import assert from 'node:assert/strict';
import {
  claimTokenFor, hashClaimToken, maySignedInUserClaim, parseProvisionBody, provisionSecret, signProvision, verifyProvisionSignature,
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
  orderId: 'cs_test_abc123', email: 'a@b.co', name: '', productType: 'card', quantity: 2, livemode: false,
});
for (const bad of [{}, { orderId: 'x', email: 'a@b.co' }, { orderId: 'cs_test_1', email: 'nope' }, { orderId: 'cs_test_1', email: 'a@b.co', quantity: 0 }, { orderId: 'cs_test_1', email: 'a@b.co', productType: 'hat' }]) {
  assert.equal(parseProvisionBody(bad), null, JSON.stringify(bad));
}
// Tap-to-claim rules
assert.ok(maySignedInUserClaim({ status: 'ready' }, { email: 'x@y.z' }, false), 'ready: anyone');
assert.ok(maySignedInUserClaim({ status: 'sold', orderEmail: 'buyer@x.co' }, { email: 'BUYER@x.co' }, false), 'sold: matching email');
assert.ok(!maySignedInUserClaim({ status: 'sold', orderEmail: 'buyer@x.co' }, { email: 'other@x.co' }, false), 'sold: stranger blocked');
assert.ok(maySignedInUserClaim({ status: 'sold', orderEmail: 'buyer@x.co' }, { email: 'other@x.co' }, true), 'sold: redeemed link');
assert.ok(maySignedInUserClaim({ status: 'sold', orderEmail: '' }, {}, false), 'sold without email: open');
assert.ok(!maySignedInUserClaim({ status: 'claimed' }, {}, false) && !maySignedInUserClaim({ status: 'disabled' }, {}, false));
console.log('provision.verify: all checks passed');
