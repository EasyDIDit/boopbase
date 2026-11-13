'use client';

import { useState } from 'react';
import Link from 'next/link';
import BoopLogo from '@/components/BoopLogo';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('The two passwords don’t match.');
      return;
    }
    setLoading(true);
    try {
      const token = new URLSearchParams(window.location.search).get('token') || '';
      const res = await fetch('/api/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg(data.message || 'Password updated.');
        // Drop the token from the address bar and history.
        window.history.replaceState(null, '', '/reset-password');
      } else setError(data.error || 'Something went wrong. Try again.');
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
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Set a new password</h1>
        </div>
        {msg ? (
          <div className="space-y-6 text-center">
            <p role="status" className="rounded-2xl bg-emerald-400/10 px-4 py-4 text-emerald-300">{msg}</p>
            <Link href="/login" className="inline-block min-h-14 w-full rounded-2xl bg-white py-4 text-lg font-bold text-black">Sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input type="password" autoComplete="new-password" placeholder="New password (6+ characters)" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-base focus:border-white focus:outline-none" required />
            <input type="password" autoComplete="new-password" placeholder="Type it again" minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-base focus:border-white focus:outline-none" required />
            {error && <p role="alert" className="text-center text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="min-h-14 w-full rounded-2xl bg-white text-lg font-bold text-black disabled:opacity-50">
              {loading ? 'Saving…' : 'Save new password'}
            </button>
            <p className="text-center text-sm text-white/50">
              Link expired? <Link href="/forgot-password" className="font-semibold text-white underline">Get a new one</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
