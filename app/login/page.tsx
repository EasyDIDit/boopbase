'use client';

import { useState } from 'react';
import Link from 'next/link';
import BoopLogo from '@/components/BoopLogo';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pendingCode =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('code') || ''
      : '';

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
        const code = new URLSearchParams(window.location.search).get('code');
        if (code) {
          await fetch('/api/devices/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });
        }
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <BoopLogo variant="white" className="h-10 w-auto max-w-[9rem]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
          <p className="text-zinc-400 mt-2">Your Boop profile</p>
          {pendingCode && (
            <p className="text-emerald-400 mt-3 font-mono text-sm">
              Claiming {pendingCode.toUpperCase()}
            </p>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Username or Email"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-white"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-white"
              required
            />
          </div>

          {error && <p className="text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-4 rounded-2xl hover:bg-yellow-300 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-zinc-400">
            Don't have an account?{' '}
            <Link
              href={pendingCode ? `/register?code=${pendingCode}` : '/register'}
              className="text-white hover:underline font-medium"
            >
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
