// Run: npx tsx lib/webNfc.verify.ts — simulates Chrome's NDEFReader (no real NFC hardware).
import assert from 'node:assert/strict';

type Rec = { recordType: string; data: string };
let tag: Rec[] | null = [];
let tagPresent = true;
let locked = false;
let lockFails = false;
class FakeReader extends EventTarget {
  async write(msg: { records: Rec[] }, opts: { overwrite?: boolean }) {
    if (!tagPresent) throw Object.assign(new Error('x'), { name: 'AbortError' });
    if (locked) throw Object.assign(new Error('x'), { name: 'InvalidStateError' });
    assert.equal(opts.overwrite, true);
    tag = msg.records;
  }
  async scan() {
    if (!tagPresent) return; // never fires → timeout path
    setTimeout(() => {
      const ev = Object.assign(new Event('reading'), {
        serialNumber: '04:a1:b2',
        message: { records: (tag || []).map((r) => ({ recordType: r.recordType, data: new DataView(new TextEncoder().encode(r.data).buffer) })) },
      });
      this.dispatchEvent(ev);
    }, 5);
  }
  async makeReadOnly() { if (lockFails) throw Object.assign(new Error('x'), { name: 'NotReadableError' }); locked = true; }
}
(globalThis as unknown as { window: unknown }).window = { NDEFReader: FakeReader, isSecureContext: true };

async function main() {
  const m = await import('./webNfc');
  assert.ok(m.webNfcSupported() && m.canMakeReadOnly());
  const url = 'https://www.boopbase.com/p/ABC123';
  const r = await m.writeAndVerifyUrl(url);
  assert.deepEqual(r, { verified: true, serial: '04:a1:b2', readUrl: url });
  assert.deepEqual(tag, [{ recordType: 'url', data: url }], 'single URL record, overwrite');

  // Tag removed right after write → read-back times out → not verified (caller does not save)
  const origScan = FakeReader.prototype.scan;
  FakeReader.prototype.scan = async function () {};
  assert.equal((await m.writeAndVerifyUrl(url)).verified, false);
  FakeReader.prototype.scan = origScan;

  // Read-back shows different content → not verified
  const origWrite = FakeReader.prototype.write;
  FakeReader.prototype.write = async function () { tag = [{ recordType: 'url', data: 'https://evil.example/' }]; };
  const bad = await m.writeAndVerifyUrl(url);
  assert.equal(bad.verified, false);
  assert.equal(bad.readUrl, 'https://evil.example/');
  FakeReader.prototype.write = origWrite;

  // Auto-lock: verify fail -> no lock
  FakeReader.prototype.write = async function () { tag = [{ recordType: 'url', data: 'https://www.boopbase.com/p/OTHER1' }]; };
  const wf = await m.writeVerifyAndLock(url);
  assert.equal(wf.verified, false); assert.equal(wf.locked, false); assert.equal(locked, false, 'wrong URL never locked');
  FakeReader.prototype.write = origWrite;
  FakeReader.prototype.scan = async function () {}; // read-back sees nothing
  const wn = await m.writeVerifyAndLock(url, { timeoutMs: 50 });
  assert.equal(wn.verified, false); assert.equal(locked, false, 'unverified never locked');
  FakeReader.prototype.scan = origScan;
  // Lock fails -> write counts, not locked, message for retry
  lockFails = true;
  const lf = await m.writeVerifyAndLock(url);
  assert.equal(lf.verified, true); assert.equal(lf.locked, false); assert.ok(lf.lockError); assert.equal(locked, false);
  // verifyThenLock refuses a card holding another URL, then locks the right one
  const other = await m.verifyThenLock('https://www.boopbase.com/p/ZZZ999', 500);
  assert.equal(other.locked, false); assert.equal(locked, false);
  await assert.rejects(m.verifyThenLock(url, 500)); // still failing lock -> throws, caller shows retry
  lockFails = false;

  // Erase writes one empty record and verifies it
  const er = await m.eraseTag();
  assert.equal(er.verified, true);
  assert.deepEqual(tag?.map((r) => r.recordType), ['empty']);
  await m.writeAndVerifyUrl(url); // rewrite after erase works

  // Happy path: verify then lock
  const wl = await m.writeVerifyAndLock(url);
  assert.equal(wl.verified, true); assert.equal(wl.locked, true); assert.ok(locked, 'locked only after verify');
  await assert.rejects(m.eraseTag(), (e: { name: string }) => e.name === 'InvalidStateError');
  await assert.rejects(m.writeAndVerifyUrl(url), (e: { name: string }) => e.name === 'InvalidStateError');
  assert.match(m.nfcErrorMessage({ name: 'InvalidStateError' }), /locked/);
  assert.match(m.nfcErrorMessage({ name: 'NotAllowedError' }), /Permissions/);

  (globalThis as unknown as { window: unknown }).window = { isSecureContext: true }; // iPhone/desktop
  assert.equal(m.webNfcSupported(), false);
  console.log('webNfc.verify: all checks passed (simulated NDEFReader)');
}
main().catch((e) => { console.error(e); process.exit(1); });
