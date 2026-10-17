'use client';

import { useState } from 'react';

export default function ClaimLinkActions({ token, username }: { token: string; username: string | null }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const q = `?claim=${encodeURIComponent(token)}`;

  if (!username) {
    return (
      <div className="flex flex-col gap-3">
        <a href={`/register${q}`} className="flex min-h-14 items-center justify-center rounded-2xl bg-white text-lg font-extrabold text-black">
          Create my page
        </a>
        <a href={`/login${q}`} className="text-center text-sm font-bold underline">
          I already have a BOOP page — sign in
        </a>
      </div>
    );
  }

  const finish = async () => {
    setBusy(true);
    setError('');
    const res = await fetch('/api/claim-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) window.location.href = '/dashboard';
    else {
      setError(data.error || 'Could not finish setup');
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button onClick={finish} disabled={busy} className="min-h-14 rounded-2xl bg-white text-lg font-extrabold text-black disabled:opacity-60">
        {busy ? 'Linking…' : `Link this card to @${username}`}
      </button>
      <a href={`/login${q}`} className="text-center text-sm underline text-white/70">Not you? Sign in with another account</a>
      {error && <p role="alert" className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}
    </div>
  );
}
