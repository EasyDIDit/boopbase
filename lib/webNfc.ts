/**
 * Web NFC helpers (Android Chrome only). Browser code; no server imports.
 * Minimal typings because TypeScript's DOM lib does not ship NDEFReader yet.
 */
type NdefRecordInit = { recordType: string; data?: string | BufferSource; mediaType?: string };
type NdefRecord = { recordType: string; data?: DataView; encoding?: string; mediaType?: string };
type NdefReadingEvent = Event & { serialNumber: string; message: { records: NdefRecord[] } };
interface NdefReaderLike extends EventTarget {
  write(message: { records: NdefRecordInit[] }, options?: { overwrite?: boolean; signal?: AbortSignal }): Promise<void>;
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  makeReadOnly?(options?: { signal?: AbortSignal }): Promise<void>;
}
type NdefReaderCtor = new () => NdefReaderLike;

function ctor(): NdefReaderCtor | null {
  if (typeof window === 'undefined') return null;
  return ((window as unknown as { NDEFReader?: NdefReaderCtor }).NDEFReader) ?? null;
}

export function webNfcSupported(): boolean {
  return !!ctor() && window.isSecureContext;
}

export function canMakeReadOnly(): boolean {
  const C = ctor();
  return !!C && typeof C.prototype.makeReadOnly === 'function';
}

/** Turns NFC errors into words EASY can act on. */
export function nfcErrorMessage(err: unknown): string {
  const e = err as { name?: string; message?: string };
  switch (e?.name) {
    case 'NotAllowedError':
      return 'NFC permission was blocked. In Chrome: tap the lock icon → Permissions → NFC → Allow. Also check NFC is on in Android settings.';
    case 'NotSupportedError':
      return 'This phone or browser cannot write NFC here. Use NFC Tools with the URL below.';
    case 'NotReadableError':
      return 'Could not talk to the card. Hold it flat on the back of the phone and try again.';
    case 'NetworkError':
      return 'The card moved away while writing. Hold it still and try again.';
    case 'AbortError':
    case 'TimeoutError':
      return 'Timed out waiting for a card. Tap Write and hold the card to the back of the phone.';
    case 'InvalidStateError':
      return 'This card is locked (read-only) or not writable.';
    default:
      return e?.message || 'NFC write failed. Try again or use NFC Tools.';
  }
}

function decodeUrl(r: NdefRecord): string | null {
  if (!r.data) return null;
  if (r.recordType === 'url' || r.recordType === 'absolute-url') return new TextDecoder().decode(r.data);
  return null;
}

export type WriteResult = { verified: boolean; serial: string | null; readUrl: string | null };

/**
 * Writes one URL record (overwrites what is on the tag), then reads the tag back and checks the URL.
 * The card must stay on the phone for both steps (a few seconds).
 */
export async function writeAndVerifyUrl(url: string, opts: { timeoutMs?: number } = {}): Promise<WriteResult> {
  const C = ctor();
  if (!C) throw Object.assign(new Error('Web NFC not supported'), { name: 'NotSupportedError' });
  const timeoutMs = opts.timeoutMs ?? 20000;
  const writer = new C();
  await writer.write({ records: [{ recordType: 'url', data: url }] }, { overwrite: true, signal: AbortSignal.timeout(timeoutMs) });

  // Read back: Chrome fires `reading` for a tag that is (still) in the field once scan() starts.
  const reader = new C();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 6000);
  try {
    const ev = await new Promise<NdefReadingEvent>((resolve, reject) => {
      reader.addEventListener('reading', (e) => resolve(e as NdefReadingEvent), { once: true });
      reader.addEventListener('readingerror', () => reject(Object.assign(new Error('read failed'), { name: 'NotReadableError' })), { once: true });
      ctl.signal.addEventListener('abort', () => reject(Object.assign(new Error('read timeout'), { name: 'TimeoutError' })));
      reader.scan({ signal: ctl.signal }).catch(reject);
    });
    const urls = ev.message.records.map(decodeUrl).filter((u): u is string => !!u);
    const readUrl = urls[0] ?? null;
    return { verified: urls.length === 1 && readUrl === url && ev.message.records.length === 1, serial: ev.serialNumber || null, readUrl };
  } catch (err) {
    if ((err as { name?: string }).name === 'TimeoutError') return { verified: false, serial: null, readUrl: null };
    throw err;
  } finally {
    clearTimeout(timer);
    ctl.abort();
  }
}

/** PERMANENT. Makes the tag read-only. Only call after an explicit confirm. */
export async function lockTag(timeoutMs = 20000): Promise<void> {
  const C = ctor();
  const r = C ? new C() : null;
  if (!r?.makeReadOnly) throw Object.assign(new Error('Locking is not supported in this browser'), { name: 'NotSupportedError' });
  await r.makeReadOnly({ signal: AbortSignal.timeout(timeoutMs) });
}

/**
 * Erase, like NFC Tools' "Erase tag": overwrites the tag with a single empty NDEF record, then reads back to check.
 * Fails on a locked (read-only) tag. Does not touch NTAG password settings — Web NFC has no access to those.
 */
export async function eraseTag(opts: { timeoutMs?: number } = {}): Promise<{ verified: boolean; serial: string | null }> {
  const C = ctor();
  if (!C) throw Object.assign(new Error('Web NFC not supported'), { name: 'NotSupportedError' });
  const writer = new C();
  await writer.write({ records: [{ recordType: 'empty' }] }, { overwrite: true, signal: AbortSignal.timeout(opts.timeoutMs ?? 20000) });
  const reader = new C();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 6000);
  try {
    const ev = await new Promise<NdefReadingEvent>((resolve, reject) => {
      reader.addEventListener('reading', (e) => resolve(e as NdefReadingEvent), { once: true });
      reader.addEventListener('readingerror', () => reject(Object.assign(new Error('read failed'), { name: 'NotReadableError' })), { once: true });
      ctl.signal.addEventListener('abort', () => reject(Object.assign(new Error('read timeout'), { name: 'TimeoutError' })));
      reader.scan({ signal: ctl.signal }).catch(reject);
    });
    const recs = ev.message.records;
    return { verified: recs.length === 0 || recs.every((r) => r.recordType === 'empty'), serial: ev.serialNumber || null };
  } catch (err) {
    if ((err as { name?: string }).name === 'TimeoutError') return { verified: false, serial: null };
    throw err;
  } finally {
    clearTimeout(timer);
    ctl.abort();
  }
}

export type WriteLockResult = WriteResult & { locked: boolean; lockError: string | null };

/**
 * Write → read back → lock (EASY, Oct 17: auto permanent lock). Locks ONLY when the read-back shows exactly `url`
 * as the single record. A lock failure never throws: the write still counts, and the caller offers "Lock" to retry.
 */
export async function writeVerifyAndLock(
  url: string,
  opts: { lock?: boolean; timeoutMs?: number } = {}
): Promise<WriteLockResult> {
  const r = await writeAndVerifyUrl(url, { timeoutMs: opts.timeoutMs });
  if (!r.verified || opts.lock === false) return { ...r, locked: false, lockError: null };
  try {
    await lockTag(opts.timeoutMs);
    return { ...r, locked: true, lockError: null };
  } catch (err) {
    return { ...r, locked: false, lockError: nfcErrorMessage(err) };
  }
}

/**
 * Lock an already-written card later: reads it first and locks ONLY if it holds exactly `url` (so the wrong card,
 * or a blank one, is never locked).
 */
export async function verifyThenLock(url: string, timeoutMs = 20000): Promise<{ locked: boolean; readUrl: string | null; serial: string | null }> {
  const C = ctor();
  if (!C) throw Object.assign(new Error('Web NFC not supported'), { name: 'NotSupportedError' });
  const reader = new C();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let ev: NdefReadingEvent;
  try {
    ev = await new Promise<NdefReadingEvent>((resolve, reject) => {
      reader.addEventListener('reading', (e) => resolve(e as NdefReadingEvent), { once: true });
      reader.addEventListener('readingerror', () => reject(Object.assign(new Error('read failed'), { name: 'NotReadableError' })), { once: true });
      ctl.signal.addEventListener('abort', () => reject(Object.assign(new Error('read timeout'), { name: 'TimeoutError' })));
      reader.scan({ signal: ctl.signal }).catch(reject);
    });
  } finally {
    clearTimeout(timer);
    ctl.abort();
  }
  const urls = ev.message.records.map(decodeUrl).filter((u): u is string => !!u);
  const readUrl = urls[0] ?? null;
  if (!(urls.length === 1 && readUrl === url && ev.message.records.length === 1)) return { locked: false, readUrl, serial: ev.serialNumber || null };
  await lockTag(timeoutMs);
  return { locked: true, readUrl, serial: ev.serialNumber || null };
}
