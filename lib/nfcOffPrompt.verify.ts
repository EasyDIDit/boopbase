// Run: npx tsx lib/nfcOffPrompt.verify.ts — NFC-off helpers with a simulated NDEFReader (no real NFC hardware).
import assert from 'node:assert/strict';

let nfcOn = false;
let permission = true;
let active = 0;
const readers: FakeReader[] = [];
class FakeReader extends EventTarget {
  constructor() { super(); readers.push(this); }
  async scan(opts: { signal?: AbortSignal } = {}) {
    if (!permission) throw Object.assign(new Error('needs gesture'), { name: 'NotAllowedError' });
    if (!nfcOn) throw Object.assign(new Error('NFC setting is disabled.'), { name: 'NotReadableError' });
    active++;
    opts.signal?.addEventListener('abort', () => active--);
  }
  tap(url: string, recordType = 'url') {
    const ev = Object.assign(new Event('reading'), {
      serialNumber: '04:a1',
      message: { records: [{ recordType, data: new DataView(new TextEncoder().encode(url).buffer) }] },
    });
    this.dispatchEvent(ev);
  }
}
(globalThis as unknown as { window: unknown }).window = { NDEFReader: FakeReader, isSecureContext: true };

async function main() {
  const m = await import('./webNfc');

  assert.equal(m.NFC_SETTINGS_INTENT, 'intent:#Intent;action=android.settings.NFC_SETTINGS;end');
  assert.ok(m.isAndroidUA('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36'));
  assert.ok(!m.isAndroidUA('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15'));
  assert.ok(!m.isAndroidUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131'));

  assert.ok(m.isNfcOffError({ name: 'NotReadableError' }));
  for (const e of [{ name: 'NotAllowedError' }, { name: 'NotSupportedError' }, { name: 'AbortError' }, null, undefined, 'x']) assert.ok(!m.isNfcOffError(e));

  // Only BOOP card links are ever opened
  assert.equal(m.boopTapUrl('https://www.boopbase.com/p/ABC123'), 'https://www.boopbase.com/p/ABC123');
  assert.equal(m.boopTapUrl('https://boopbase.com/p/PEASY1/'), 'https://www.boopbase.com/p/PEASY1');
  assert.equal(m.boopTapUrl('https://www.boopbase.com/p/ABC123?x=1#y'), 'https://www.boopbase.com/p/ABC123');
  for (const bad of ['http://www.boopbase.com/p/ABC123', 'https://evil.example/p/ABC123', 'https://boopbase.com.evil.example/p/A1', 'https://www.boopbase.com/dashboard', 'https://www.boopbase.com/p/../api/me', 'javascript:alert(1)', 'intent:#Intent;end', '', null, undefined, 'not a url']) {
    assert.equal(m.boopTapUrl(bad as string), null, `rejected: ${bad}`);
  }

  // Probe: off / on / no permission yet; never leaves a scan running
  nfcOn = false;
  assert.equal(await m.probeNfc(), 'off');
  nfcOn = true;
  assert.equal(await m.probeNfc(), 'on');
  assert.equal(active, 0, 'probe stops its scan (normal NFC-on flow untouched)');
  permission = false;
  assert.equal(await m.probeNfc(), 'blocked', 'permission blocked / not asked → "allow NFC" note (only shown after a tap)');
  assert.equal(active, 0);
  permission = true;

  // Resume: still off → rejects; on → listens, opens only BOOP links, stop() ends it
  nfcOn = false;
  await assert.rejects(m.listenForBoopCard(() => {}), (e: { name: string }) => e.name === 'NotReadableError');
  assert.equal(active, 0);
  nfcOn = true;
  const opened: string[] = [];
  const stop = await m.listenForBoopCard((u) => opened.push(u));
  assert.equal(active, 1);
  readers[readers.length - 1].tap('https://evil.example/');
  readers[readers.length - 1].tap('hello', 'text');
  readers[readers.length - 1].tap('https://boopbase.com/p/ABC123');
  assert.deepEqual(opened, ['https://www.boopbase.com/p/ABC123']);
  stop();
  assert.equal(active, 0);
  readers[readers.length - 1].tap('https://www.boopbase.com/p/ZZZ999');
  assert.equal(opened.length, 1, 'no reads after stop');

  // Error → outcome mapping used by the "Card not opening when you tap it?" check
  assert.equal(m.nfcProbeFromError({ name: 'NotReadableError' }), 'off');
  assert.equal(m.nfcProbeFromError({ name: 'NotAllowedError' }), 'blocked');
  assert.equal(m.nfcProbeFromError({ name: 'NotSupportedError' }), 'nonfc');
  for (const e of [{ name: 'AbortError' }, { name: 'NetworkError' }, null, undefined, 'x']) assert.equal(m.nfcProbeFromError(e), 'unknown');
  // Phone without NFC hardware
  const origScan = FakeReader.prototype.scan;
  FakeReader.prototype.scan = async function () { throw Object.assign(new Error('no nfc'), { name: 'NotSupportedError' }); };
  assert.equal(await m.probeNfc(), 'nonfc');
  FakeReader.prototype.scan = origScan;

  (globalThis as unknown as { window: unknown }).window = { isSecureContext: true }; // iPhone / desktop
  assert.equal(await m.probeNfc(), 'nonfc');
  assert.equal(m.webNfcSupported(), false, 'iPhone/desktop: component renders nothing');
  console.log('nfcOffPrompt.verify: all checks passed (simulated NDEFReader)');
}
main().catch((e) => { console.error(e); process.exit(1); });
