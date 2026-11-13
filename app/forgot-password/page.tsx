'use client';

import { useState } from 'react';
import Link from 'next/link';
import BoopLogo from '@/components/BoopLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const res = await fetch('/api/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setMsg(data.message || 'Check your email for a reset link.');
      else setError(data.error || 'Something went wrong. Try again.');
    } catch {
      setError('Something went wrong. Try again.');
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
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Forgot your password?</h1>
          <p className="mt-3 text-sm text-white/50">Enter the email you sign in with. We&apos;ll send a link to set a new one.</p>
        </div>
        {msg ? (
          <p role="status" className="rounded-2xl bg-emerald-400/10 px-4 py-4 text-center text-emerald-300">{msg}</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-base focus:border-white focus:outline-none"
              required
              autoCapitalize="none"
            />
            {error && <p role="alert" className="text-center text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="min-h-14 w-full rounded-2xl bg-white text-lg font-bold text-black disabled:opacity-50">
              {loading ? 'Sending…' : 'Email me a reset link'}
            </button>
          </form>
        )}
        <p className="mt-8 text-center text-sm text-white/50">
          <Link href="/login" className="font-semibold text-white underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
