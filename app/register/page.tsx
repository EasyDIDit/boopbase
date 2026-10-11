'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BoopLogo from '@/components/BoopLogo';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const pendingCode =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('code') || ''
      : '';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          username,
          password,
          code: pendingCode || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-5 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-5 flex justify-center">
            <BoopLogo variant="white" className="h-10 w-auto max-w-[9rem]" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            {pendingCode ? 'Step 2 of 3' : 'New page'}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {pendingCode ? 'Make your page. Claim the card.' : 'Create your page'}
          </h1>
          <p className="mt-2 text-sm text-white/55">
            {pendingCode
              ? 'Fill this once. Do not close the page. The card locks to you when you finish.'
              : 'Name, email, username, password. Then your page is live.'}
          </p>
          {pendingCode && (
            <p className="mt-4 rounded-2xl bg-emerald-400/10 px-4 py-3 font-mono text-lg text-emerald-300">
              Claiming {pendingCode.toUpperCase()}
            </p>
          )}
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <label className="block text-sm">
            Your name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 focus:border-white focus:outline-none"
              required
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 focus:border-white focus:outline-none"
              required
            />
          </label>
          <label className="block text-sm">
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 focus:border-white focus:outline-none"
              required
            />
            <span className="mt-1 block text-xs text-white/40">This becomes boopbase.com/yourname</span>
          </label>
          <label className="block text-sm">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 focus:border-white focus:outline-none"
              required
            />
          </label>

          {error && <p className="text-center text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="min-h-14 w-full rounded-2xl bg-white text-lg font-bold text-black disabled:opacity-50"
          >
            {loading
              ? 'Locking it in...'
              : pendingCode
                ? 'Finish and claim my Boop'
                : 'Create my page'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          Already have a page?{' '}
          <a href={pendingCode ? `/login?code=${pendingCode}` : '/login'} className="font-semibold text-white underline">
            Sign in instead
          </a>
        </p>
      </div>
    </div>
  );
}
