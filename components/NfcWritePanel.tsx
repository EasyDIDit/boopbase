'use client';

import { useEffect, useState } from 'react';
import { canMakeReadOnly, eraseTag, lockTag, nfcErrorMessage, webNfcSupported, writeAndVerifyUrl } from '@/lib/webNfc';

type Props = {
  code: string;
  url: string;
  /** Called after the chip was written, read back OK and saved. */
  onWritten?: (code: string) => void;
};

type Phase = 'idle' | 'writing' | 'saving' | 'done' | 'unverified' | 'error';

/**
 * "Write to card" with Web NFC (Android Chrome). Writes one URL record, reads it back, then records it.
 * Elsewhere (iPhone, desktop) it explains how to do it in NFC Tools instead.
 */
export default function NfcWritePanel({ code, url, onWritten }: Props) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [note, setNote] = useState('');
  const [lock, setLock] = useState(false);

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
          above, then hold the card to the phone.
        </p>
      </div>
    );
  }

  const toggleLock = (checked: boolean) => {
    if (!checked) return setLock(false);
    const ok = window.confirm(
      `Lock card ${code} as read-only after writing?\n\nThis is PERMANENT. The card can never be rewritten or fixed, even by you. Only lock cards you are sure about.`
    );
    setLock(ok);
  };

  const write = async () => {
    setPhase('writing');
    setNote('Hold the card flat on the back of the phone and keep it there…');
    try {
      const result = await writeAndVerifyUrl(url);
      if (!result.verified) {
        setPhase('unverified');
        setNote(
          result.readUrl
            ? `Read back a different URL (${result.readUrl}). Not saved. Try again.`
            : 'Written, but the read-back did not see the card. Keep the card on the phone and tap Write again. Not saved yet.'
        );
        return;
      }
      let locked = false;
      if (lock) {
        setNote('Verified. Locking the card (permanent)… keep holding it.');
        await lockTag();
        locked = true;
      }
      setPhase('saving');
      const res = await fetch('/api/devices/programmed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, url, serial: result.serial, locked }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhase('error');
        setNote(`Card written and verified, but saving failed: ${data.error || res.status}. Tap Write again to re-save.`);
        return;
      }
      setPhase('done');
      setNote(`Card ${code} written and verified${locked ? ' and locked' : ''}.`);
      onWritten?.(code);
    } catch (err) {
      setPhase('error');
      setNote(nfcErrorMessage(err));
    }
  };

  const erase = async () => {
    if (!window.confirm('Erase this card? Whatever is on it now (its link) is wiped, so tapping it will open nothing until you write it again. Locked cards cannot be erased.')) return;
    setPhase('writing');
    setNote('Hold the card flat on the back of the phone and keep it there…');
    try {
      const r = await eraseTag();
      setPhase(r.verified ? 'done' : 'unverified');
      setNote(r.verified ? 'Card erased and checked. It is blank now. Tap Write to card to put a link back on it.' : 'Erase sent, but the read-back did not see the card. Hold it still and tap Erase again.');
    } catch (err) {
      setPhase('error');
      setNote(nfcErrorMessage(err));
    }
  };

  const busy = phase === 'writing' || phase === 'saving';
  return (
    <div className="mt-3 rounded-2xl bg-zinc-800 p-3">
      <button
        onClick={write}
        disabled={busy}
        className="min-h-12 w-full rounded-xl bg-sky-300 font-bold text-black disabled:opacity-60"
      >
        {busy ? (phase === 'saving' ? 'Saving…' : 'Hold card to phone…') : phase === 'done' ? 'Write again' : 'Write to card'}
      </button>
      <button onClick={erase} disabled={busy} className="mt-2 min-h-10 w-full rounded-xl bg-zinc-700 text-sm font-semibold disabled:opacity-60">
        Erase card
      </button>
      {canMakeReadOnly() && (
        <label className="mt-2 flex items-center gap-2 text-xs text-white/60">
          <input type="checkbox" checked={lock} onChange={(e) => toggleLock(e.target.checked)} disabled={busy} />
          Lock card read-only after writing (permanent)
        </label>
      )}
      <p className="mt-2 text-xs text-white/50">
        Password protect: Chrome can&apos;t set or remove a card password. Use NFC Tools (Other → Set password / Remove
        password). The lock above is not a password: it is permanent and can never be undone.
      </p>
      {note && (
        <p
          role="status"
          className={`mt-2 text-sm ${phase === 'done' ? 'text-emerald-300' : phase === 'error' || phase === 'unverified' ? 'text-red-300' : 'text-white/70'}`}
        >
          {note}
        </p>
      )}
    </div>
  );
}
