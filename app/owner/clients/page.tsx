'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type DeviceRow = {
  code: string;
  productType: string;
  status: string;
  programmedUrl?: string;
  ownerUsername?: string;
};

type ClientRow = {
  email: string;
  username: string;
  devices: DeviceRow[];
};

export default function OwnerClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [signedOut, setSignedOut] = useState(false);

  const load = async () => {
    const res = await fetch('/api/owner/clients');
    const data = await res.json();
    if (!res.ok) {
      setSignedOut(true);
      setMessage(data.error || 'Sign in as the shop owner first');
      setClients([]);
      return;
    }
    setSignedOut(false);
    setClients(data.clients || []);
    setMessage('');
  };

  useEffect(() => {
    load();
  }, []);

  const saveClient = async () => {
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/owner/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (res.status === 403) setSignedOut(true);
      setMessage(data.error || 'Could not save client');
      return;
    }
    setMessage(`Saved ${data.email}`);
    load();
  };

  const assign = async () => {
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/owner/clients/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (res.status === 403) setSignedOut(true);
      setMessage(data.error || 'Could not assign code');
      return;
    }
    setMessage(data.message);
    setCode('');
    load();
  };

  if (signedOut) {
    return (
      <div className="min-h-screen bg-zinc-950 px-5 py-10 text-white">
        <div className="mx-auto max-w-md text-center">
          <p className="text-xs tracking-[4px] text-white/40">MINT</p>
          <h1 className="mt-3 text-3xl font-bold">Sign in to see clients</h1>
          <p className="mt-3 text-white/60">
            Sign in as peasy1. You will come back to this list.
          </p>
          <Link
            href="/login?next=/owner/clients"
            className="mt-8 flex min-h-14 items-center justify-center rounded-2xl bg-white text-lg font-bold text-black"
          >
            Sign in to mint
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs tracking-[4px] text-white/40">MINT</p>
        <h1 className="mt-2 text-3xl font-bold">Clients</h1>
        <p className="mt-2 text-sm text-white/60">
          Who claimed a Boop, and which codes are on their page.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/owner/devices" className="underline text-white/70">
            Mint codes
          </Link>
        </p>

        <div className="mt-6 grid gap-3 rounded-3xl bg-zinc-900 p-4 sm:grid-cols-2 sm:p-6">
          <label className="block sm:col-span-2">
            <span className="text-sm text-white/50">Purchase email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 block min-h-12 w-full rounded-xl bg-zinc-800 px-4 py-3"
              placeholder="buyer@email.com"
            />
          </label>
          <label className="block">
            <span className="text-sm text-white/50">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="mt-2 block min-h-12 w-full rounded-xl bg-zinc-800 px-4 py-3"
              placeholder="peasy1"
              autoCapitalize="none"
            />
          </label>
          <label className="block">
            <span className="text-sm text-white/50">Code to attach</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="mt-2 block min-h-12 w-full rounded-xl bg-zinc-800 px-4 py-3 font-mono"
              placeholder="PEASY2"
              autoCapitalize="characters"
            />
          </label>
          <button
            onClick={saveClient}
            disabled={loading}
            className="min-h-12 rounded-xl bg-zinc-700 font-bold disabled:opacity-50"
          >
            Save email / username
          </button>
          <button
            onClick={assign}
            disabled={loading}
            className="min-h-12 rounded-xl bg-white font-bold text-black disabled:opacity-50"
          >
            Attach code
          </button>
        </div>

        {message && <p className="mt-4 text-yellow-300">{message}</p>}

        <div className="mt-6 space-y-4">
          {clients.length === 0 && (
            <p className="text-sm text-white/40">No clients yet. They appear when someone claims a card.</p>
          )}
          {clients.map((c) => (
            <div key={c.email} className="rounded-2xl bg-zinc-900 p-5">
              <p className="font-medium">{c.email}</p>
              <p className="mb-3 text-sm text-white/50">
                {c.username ? (
                  <a href={`/${c.username}`} className="underline">
                    @{c.username}
                  </a>
                ) : (
                  'no profile yet'
                )}
              </p>
              {c.devices.length === 0 ? (
                <p className="text-sm text-white/40">No codes attached</p>
              ) : (
                <div className="space-y-2">
                  {c.devices.map((d) => (
                    <div key={d.code} className="flex flex-wrap justify-between gap-2 text-sm">
                      <span className="font-mono text-lg">{d.code}</span>
                      <span className="text-white/50">
                        {d.productType} · {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
