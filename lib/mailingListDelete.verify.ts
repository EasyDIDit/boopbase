// Run: npx tsx lib/mailingListDelete.verify.ts
import assert from 'node:assert/strict';
import { deleteSubscriber, sameOrigin, type DeleteDeps } from './mailingListDelete';

const ID = '0123456789abcdef01234567';
const SELF = 'https://www.boopbase.com';

async function main() {
  const removed: string[] = [];
  const base = (over: Partial<DeleteDeps> = {}): DeleteDeps => ({
    username: 'peasy1',
    isOwner: (u) => u === 'peasy1',
    origin: SELF,
    fetchSite: 'same-origin',
    selfOrigin: SELF,
    remove: async (id) => { removed.push(id); return id === ID ? { email: 'test+brutus@easydidit.com' } : null; },
    ...over,
  });

  // Owner can delete exactly that id
  assert.deepEqual(await deleteSubscriber(ID, base()), { status: 200, body: { ok: true, email: 'test+brutus@easydidit.com' } });
  assert.deepEqual(removed, [ID]);

  // Anonymous → 401, non-owner → 403; nothing removed
  removed.length = 0;
  assert.equal((await deleteSubscriber(ID, base({ username: null }))).status, 401);
  assert.equal((await deleteSubscriber(ID, base({ username: 'someone' }))).status, 403);
  // Cross-site (CSRF) → 403
  assert.equal((await deleteSubscriber(ID, base({ origin: 'https://evil.example', fetchSite: 'cross-site' }))).status, 403);
  assert.equal((await deleteSubscriber(ID, base({ origin: null, fetchSite: null }))).status, 403, "no origin info is refused");
  // Invalid ids → 400 without touching the DB
  for (const bad of [null, '', 'abc', '{"$ne":null}', ID + 'x', 42, { $gt: '' }]) {
    assert.equal((await deleteSubscriber(bad, base())).status, 400, `rejects ${JSON.stringify(bad)}`);
  }
  assert.deepEqual(removed, [], 'no DB call for refused or invalid requests');
  // Unknown id → 404
  assert.equal((await deleteSubscriber('ffffffffffffffffffffffff', base())).status, 404);

  assert.equal(sameOrigin(SELF, 'same-origin', SELF), true);
  assert.equal(sameOrigin(SELF, null, SELF), true, 'older browsers: Origin only');
  assert.equal(sameOrigin('https://boopbase.com', 'same-site', SELF), false);
  console.log('mailingListDelete.verify: all passed');
}
main().catch((e) => { console.error(e); process.exit(1); });
