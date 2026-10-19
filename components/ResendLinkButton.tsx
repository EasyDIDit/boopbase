'use client';

import { useState } from 'react';

/** "Email me a new setup link" — only ever goes to the checkout email; same answer whatever happens. */
export default function ResendLinkButton({ token, code, label = 'Email me a new setup link' }: { token?: string; code?: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [msg, setMsg] = useState('');
  const send = async () => {
    setState('busy');
    const res = await fetch('/api/claim-link/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(token ? { token } : { code }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setMsg(data.message || 'If this card is waiting to be set up, we emailed a new setup link to the email used at checkout.');
    setState('done');
  };
  if (state === 'done') return <p role="status" className="rounded-2xl bg-zinc-900 px-4 py-3 text-center text-sm text-white/80">{msg}</p>;
  return (
    <button onClick={send} disabled={state === 'busy'} className="min-h-12 rounded-2xl border border-white/30 px-4 text-sm font-bold disabled:opacity-60">
      {state === 'busy' ? 'Sending…' : label}
    </button>
  );
}
