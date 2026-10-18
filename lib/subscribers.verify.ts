// Run against a throwaway DB only: MONGODB_URI=mongodb://127.0.0.1:<port>/test npx tsx lib/subscribers.verify.ts
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Subscriber from './models/Subscriber';
import { markSubscriberCustomer } from './subscribers';

const uri = process.env.MONGODB_URI || '';
assert.match(uri, /^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/, 'refusing to run against a non-local database');

(async () => {
  await mongoose.connect(uri);
  await Subscriber.deleteMany({ email: { $in: ['newbuyer@example.com', 'fan@example.com'] } });
  await markSubscriberCustomer('NewBuyer@Example.com', 'purchase', 'New Buyer');
  let s = await Subscriber.findOne({ email: 'newbuyer@example.com' }).lean<Record<string, unknown>>();
  assert.ok(s && s.isCustomer === true && s.consentAt === null && s.customerSince, 'buyer added as customer, no marketing consent');
  await markSubscriberCustomer('newbuyer@example.com', 'claim');
  s = await Subscriber.findOne({ email: 'newbuyer@example.com' }).lean<Record<string, unknown>>();
  assert.deepEqual(s?.sources, ['purchase', 'claim'], 'idempotent, sources accumulate');
  const consentAt = new Date('2026-10-01');
  await Subscriber.create({ email: 'fan@example.com', name: 'Fan', consentAt, consentText: 'x', sources: ['join-list'] });
  await markSubscriberCustomer('fan@example.com', 'in_person');
  s = await Subscriber.findOne({ email: 'fan@example.com' }).lean<Record<string, unknown>>();
  assert.ok(s?.isCustomer === true && (s.consentAt as Date).getTime() === consentAt.getTime() && s.name === 'Fan' && s.customerSince, 'sign-up becomes customer, keeps consent/name');
  await markSubscriberCustomer('not-an-email', 'claim'); // no throw, no row
  assert.equal(await Subscriber.countDocuments({ email: 'not-an-email' }), 0);
  console.log('subscribers.verify: all passed');
  await mongoose.disconnect();
})();
