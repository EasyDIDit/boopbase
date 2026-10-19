'use client';

import { useEffect, useState } from 'react';
import { canMakeReadOnly, eraseTag, nfcErrorMessage, verifyThenLock, webNfcSupported, writeVerifyAndLock } from '@/lib/webNfc';

type Props = {
  code: string;
  url: string;
  /** Called after the chip was written, read back OK and saved. `locked` = also permanently locked. */
  onWritten?: (code: string, info: { locked: boolean; complete: boolean }) => void;
  /** Card already written but not locked: show only "Lock card". */
  lockOnly?: boolean;
  /** Card was written before but isn't locked: also offer "Lock card" without rewriting. */
  alreadyWritten?: boolean;
};

type Phase = 'idle' | 'writing' | 'saving' | 'done' | 'unlocked' | 'unverified' | 'error';

const NOTICE_KEY = 'boop.autoLockNoticeSeen';

/** One-time notice: cards are locked automatically after a verified write, and that is permanent. */
function acceptLockNotice(): boolean {
  try {
    if (window.localStorage.getItem(NOTICE_KEY) === '1') return true;
  } catch {
    /* private mode: ask every time */
  }
  const ok = window.confirm(
    'Heads up: after a card is written and checked, it is LOCKED automatically.\n\n' +
      'Locking is PERMANENT. A locked card can never be rewritten or erased, even by you. ' +
      'Its link (boopbase.com/p/CODE) still works forever, and you can still release or reassign the card here.\n\n' +
      'You will only see this once. Continue?'
  );
  if (ok) {
    try {
      window.localStorage.setItem(NOTICE_KEY, '1');
    } catch {
      /* ignore */
    }
  }
  return ok;
}

/**
 * "Write to card" with Web NFC (Android Chrome): write one URL record → read it back → if it is exactly this card's
 * URL, lock it read-only (permanent) → record it. Elsewhere (iPhone, desktop) it explains NFC Tools instead.
 */
export default function NfcWritePanel({ code, url, onWritten, lockOnly = false, alreadyWritten = false }: Props) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>(lockOnly ? 'unlocked' : 'idle');
  const [note, setNote] = useState('');

  useEffect(() => {
    // Feature detection must run in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(webNfcSupported());
  }, []);

  if (supported === null) return null;

  if (!supported) {
    return (
      <div className="mt-3 rounded-2xl bg-zinc-800 p-3 text-sm text-white/70">
        <p className="font-semibold text-white">Write to card works in Chrome on Android.</p>
        <p className="mt-1">
          On this device, open <span className="font-semibold">NFC Tools</span> → Write → Add a record → URL, paste the URL
          above, then hold the card to the phone. To lock it there: Other → Lock tag (permanent).
        </p>
      </div>
    );
  }

  const lockable = canMakeReadOnly();

  const save = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/devices/programmed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, url, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? null : String(data.error || res.status);
  };

  const write = async () => {
    if (lockable && !acceptLockNotice()) return;
    setPhase('writing');
    setNote('Hold the card flat on the back of the phone and keep it there…');
    try {
      const r = await writeVerifyAndLock(url, { lock: lockable });
      if (!r.verified) {
        setPhase('unverified');
        setNote(
          r.readUrl
            ? `Read back a different URL (${r.readUrl}). Not saved and NOT locked. Try again.`
            : 'Written, but the read-back did not see the card. Keep the card on the phone and tap Write again. Not saved, not locked.'
        );
        return;
      }
      setPhase('saving');
      const err = await save({ serial: r.serial, locked: r.locked });
      if (err) {
        setPhase('error');
        setNote(`Card written and verified${r.locked ? ' and locked' : ''}, but saving failed: ${err}. Tap again to re-save.`);
        return;
      }
      if (r.locked || !lockable) {
        setPhase('done');
        setNote(r.locked ? `Card ${code} written, verified and locked.` : `Card ${code} written and verified. (This browser can't lock cards; use NFC Tools.)`);
      } else {
        setPhase('unlocked');
        setNote(`Written, not locked - tap Lock to retry. (${r.lockError})`);
      }
      onWritten?.(code, { locked: r.locked, complete: r.locked || !lockable });
    } catch (e) {
      setPhase('error');
      setNote(nfcErrorMessage(e));
    }
  };

  const lock = async () => {
    if (!acceptLockNotice()) return;
    setPhase('writing');
    setNote('Hold the card to the phone. It is checked first and only locked if it holds this card’s link…');
    try {
      const r = await verifyThenLock(url);
      if (!r.locked) {
        setPhase('unlocked');
        setNote(r.readUrl ? `That card holds ${r.readUrl}, not this card’s link. Not locked.` : 'That card is blank or unreadable. Not locked. Write it first.');
        return;
      }
      setPhase('saving');
      const err = await save({ serial: r.serial, locked: true, action: 'locked' });
      setPhase(err ? 'error' : 'done');
      setNote(err ? `Card locked, but saving failed: ${err}. Tap Lock again to re-save.` : `Card ${code} locked.`);
      if (!err) onWritten?.(code, { locked: true, complete: true });
    } catch (e) {
      setPhase('unlocked');
      setNote(`Not locked - tap Lock to retry. (${nfcErrorMessage(e)})`);
    }
  };

  const erase = async () => {
    if (!window.confirm('Erase this card? Its link is wiped, so tapping it opens nothing until you write it again.\n\nLocked cards can NOT be erased.')) return;
    setPhase('writing');
    setNote('Hold the card flat on the back of the phone and keep it there…');
    try {
      const r = await eraseTag();
      setPhase(r.verified ? 'idle' : 'unverified');
      setNote(r.verified ? 'Card erased and checked. It is blank now. Tap Write to card to put a link back on it.' : 'Erase sent, but the read-back did not see the card. Hold it still and tap Erase again.');
    } catch (e) {
      setPhase('error');
      const name = (e as { name?: string })?.name;
      setNote(name === 'InvalidStateError' ? 'This card is locked. Locked cards can’t be erased or rewritten.' : nfcErrorMessage(e));
    }
  };

  const busy = phase === 'writing' || phase === 'saving';
  return (
    <div className="mt-3 rounded-2xl bg-zinc-800 p-3">
      {!lockOnly && (
        <button onClick={write} disabled={busy} className="min-h-12 w-full rounded-xl bg-sky-300 font-bold text-black disabled:opacity-60">
          {busy ? (phase === 'saving' ? 'Saving…' : 'Hold card to phone…') : phase === 'done' ? 'Write again' : lockable ? 'Write + lock card' : 'Write to card'}
        </button>
      )}
      {lockable && (phase === 'unlocked' || lockOnly || (alreadyWritten && phase === 'idle')) && (
        <button onClick={lock} disabled={busy} className="mt-2 min-h-12 w-full rounded-xl bg-amber-300 font-bold text-black disabled:opacity-60">
          {busy ? 'Hold card to phone…' : 'Lock card (permanent)'}
        </button>
      )}
      {!lockOnly && (
        <>
          <button onClick={erase} disabled={busy} className="mt-2 min-h-10 w-full rounded-xl bg-zinc-700 text-sm font-semibold disabled:opacity-60">
            Erase card
          </button>
          <p className="mt-1 text-xs text-white/50">Erase only works on unlocked cards. Locked cards can&apos;t be erased.</p>
        </>
      )}
      {lockable && !lockOnly && (
        <p className="mt-2 text-xs text-white/50">Cards lock automatically after the link is written and checked. Locking is permanent.</p>
      )}
      <p className="mt-2 text-xs text-white/50">
        Password protect: Chrome can&apos;t set or remove a card password. Use NFC Tools (Other → Set password / Remove
        password). Locking is not a password: it is permanent and can never be undone.
      </p>
      {note && (
        <p
          role="status"
          className={`mt-2 text-sm ${phase === 'done' ? 'text-emerald-300' : phase === 'error' || phase === 'unverified' || phase === 'unlocked' ? 'text-red-300' : 'text-white/70'}`}
        >
          {note}
        </p>
      )}
    </div>
  );
}
