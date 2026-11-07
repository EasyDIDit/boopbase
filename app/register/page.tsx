'use client';
import { FieldTip } from "@/components/FieldTip";

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
  const pendingClaim =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('claim') || ''
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
        let problem: string | null = data.claimError || null;
        if (pendingClaim) {
          const c = await fetch('/api/claim-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: pendingClaim }),
          });
          if (!c.ok) problem = (await c.json().catch(() => ({}))).error || 'Could not link your order';
        }
        if (problem) {
          setError(`Your page was created, but: ${problem}`);
          setTimeout(() => router.push('/dashboard'), 6000);
          return;
        }
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
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-5 text-center">
          <div className="mb-4 flex justify-center">
            <BoopLogo variant="white" className="h-9 w-auto max-w-[9rem]" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
            {pendingCode ? 'Almost yours' : 'New page'}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            {pendingCode ? 'Finish this. Then it is yours.' : 'Create your page'}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {pendingCode
              ? 'Fill every box. Stay on this screen. The card locks to you when you hit the button.'
              : 'Name, email, username, password. Then your page is live.'}
          </p>
          {pendingCode && (
            <p className="mt-4 rounded-2xl bg-emerald-400/15 px-4 py-3 font-mono text-lg font-bold text-emerald-300">
              Claiming {pendingCode.toUpperCase()}
            </p>
          )}
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          <label className="block text-sm font-semibold">
            Your name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What people call you, e.g. Jordan Lee"
              className="mt-1.5 min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-normal focus:border-white focus:outline-none"
              required
            />
            <FieldTip kind="public">
              The name people see on your profile.
            </FieldTip>
          </label>
          <label className="block text-sm font-semibold">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Login email, e.g. you@email.com"
              className="mt-1.5 min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-normal focus:border-white focus:outline-none"
              required
              autoCapitalize="none"
            />
            <FieldTip kind="private">
              Used to sign in. We never show this on your public profile.
            </FieldTip>
          </label>
          <label className="block text-sm font-semibold">
            Username
            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                    .toLowerCase()
                    .replace(/@/g, "")
                    .replace(/[^a-z0-9._-]/g, "")
                )
              }
              placeholder="yourname — no @"
              className="mt-1.5 min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-normal focus:border-white focus:outline-none"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
            />
            <FieldTip kind="link">
              No @. This is your link. Example: boopbase.com/yourname
            </FieldTip>
            {username ? (
              <span className="mt-1 block text-xs font-medium text-emerald-300">
                Your link: boopbase.com/{username}
              </span>
            ) : null}
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Something you will remember (6+ characters)"
              className="mt-1.5 min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-normal focus:border-white focus:outline-none"
              required
            />
            <FieldTip kind="private">
              At least 6 characters. You will use this to edit later.
            </FieldTip>
          </label>

          {error && <p role="alert" className="text-center text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="min-h-14 w-full rounded-2xl bg-white text-lg font-extrabold text-black disabled:opacity-50"
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
          <a href={pendingCode ? `/login?code=${pendingCode}` : pendingClaim ? `/login?claim=${pendingClaim}` : '/login'} className="font-semibold text-white underline">
            Sign in instead
          </a>
        </p>
      </div>
    </div>
  );
}
