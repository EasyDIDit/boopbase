'use client';

import { useState } from 'react';
import Link from 'next/link';
import BoopLogo from '@/components/BoopLogo';

function safeNext(raw: string | null) {
  if (!raw) return '';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '';
  return raw;
}

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const params =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const pendingCode = params.get('code') || '';
  const nextPath = safeNext(params.get('next'));
  const minting = nextPath.startsWith('/owner');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const data = await res.json();

      if (res.ok) {
        const search = new URLSearchParams(window.location.search);
        const code = search.get('code');
        const claim = search.get('claim');
        const step = code
          ? { url: '/api/devices/claim', body: { code } }
          : claim
            ? { url: '/api/claim-token', body: { token: claim } }
            : null;
        if (step) {
          const c = await fetch(step.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(step.body),
          });
          if (!c.ok) {
            const d = await c.json().catch(() => ({}));
            setError(`Signed in, but: ${d.error || 'could not claim'}. Opening your dashboard…`);
            setLoading(false);
            setTimeout(() => { window.location.href = '/dashboard'; }, 6000);
            return;
          }
        }
        const next = safeNext(new URLSearchParams(window.location.search).get('next'));
        window.location.href = next || '/dashboard';
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-5 py-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-5 flex justify-center">
            <BoopLogo variant="white" className="h-10 w-auto max-w-[9rem]" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            {minting ? 'Mint desk' : pendingCode ? 'Claim with your page' : 'Welcome back'}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {minting
              ? 'Sign in to mint'
              : pendingCode
                ? 'Sign in. The card locks to you.'
                : 'Sign in'}
          </h1>
          {minting && (
            <p className="mt-3 text-sm text-white/50">
              Owner only. You will land on the mint list after this.
            </p>
          )}
          {pendingCode && (
            <p className="mt-4 rounded-2xl bg-emerald-400/10 px-4 py-3 font-mono text-lg text-emerald-300">
              Claiming {pendingCode.toUpperCase()}
            </p>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username or email"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-4 focus:border-white focus:outline-none"
            required
            autoCapitalize="none"
            autoCorrect="off"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-4 focus:border-white focus:outline-none"
            required
          />
          {error && <p role="alert" className="text-center text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="min-h-14 w-full rounded-2xl bg-white text-lg font-bold text-black disabled:opacity-50"
          >
            {loading ? 'Signing in...' : minting ? 'Sign in to mint' : pendingCode ? 'Sign in and claim' : 'Sign in'}
          </button>
        </form>

        {!minting && (
          <p className="mt-8 text-center text-sm text-white/50">
            No page yet?{' '}
            <Link
              href={pendingCode ? `/register?code=${pendingCode}` : params.get('claim') ? `/register?claim=${encodeURIComponent(params.get('claim') || '')}` : '/register'}
              className="font-semibold text-white underline"
            >
              Create one and claim this card
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
