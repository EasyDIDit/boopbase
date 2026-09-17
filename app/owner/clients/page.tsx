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

  const load = async () => {
    const res = await fetch('/api/owner/clients');
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Sign in as the shop owner first');
      setClients([]);
      return;
    }
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
      setMessage(data.error || 'Could not assign code');
      return;
    }
    setMessage(data.message);
    setCode('');
    load();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs tracking-[4px] text-white/40 mb-3">OWNER</p>
        <h1 className="text-4xl font-bold mb-2">Clients</h1>
        <p className="text-white/60 mb-4">
          Purchase email + profile username + the codes you wrote on the chips.
        </p>
        <p className="text-white/40 text-sm mb-8">
          <Link href="/owner/devices" className="underline">
            Device codes
          </Link>
        </p>

        <div className="bg-zinc-900 rounded-3xl p-6 mb-8 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm text-white/50">Purchase email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block mt-2 w-full bg-zinc-800 rounded-xl px-4 py-3"
              placeholder="buyer@email.com"
            />
          </label>
          <label className="block">
            <span className="text-sm text-white/50">Username (if they have a page)</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="block mt-2 w-full bg-zinc-800 rounded-xl px-4 py-3"
              placeholder="peasy1"
            />
          </label>
          <label className="block">
            <span className="text-sm text-white/50">Code to attach</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="block mt-2 w-full bg-zinc-800 rounded-xl px-4 py-3 font-mono"
              placeholder="PEASY2"
            />
          </label>
          <button
            onClick={saveClient}
            disabled={loading}
            className="bg-zinc-700 font-bold rounded-xl px-6 py-3 disabled:opacity-50"
          >
            Save email / username
          </button>
          <button
            onClick={assign}
            disabled={loading}
            className="bg-white text-black font-bold rounded-xl px-6 py-3 disabled:opacity-50"
          >
            Attach code
          </button>
        </div>

        {message && <p className="mb-6 text-yellow-300">{message}</p>}

        <div className="space-y-4">
          {clients.map((c) => (
            <div key={c.email} className="bg-zinc-900 rounded-2xl p-5">
              <p className="font-medium">{c.email}</p>
              <p className="text-white/50 text-sm mb-3">
                {c.username ? (
                  <a href={`/${c.username}`} className="underline">
                    @{c.username}
                  </a>
                ) : (
                  'no profile yet'
                )}
              </p>
              {c.devices.length === 0 ? (
                <p className="text-white/40 text-sm">No codes attached</p>
              ) : (
                <div className="space-y-2">
                  {c.devices.map((d) => (
                    <div key={d.code} className="flex flex-wrap justify-between gap-2 text-sm">
                      <span className="font-mono">{d.code}</span>
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
