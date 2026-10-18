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
  name: string;
  phone: string;
  interests: string[];
  sources: string[];
  source: string;
  status: 'lead' | 'customer';
  consentAt: string | null;
  textConsent: boolean;
  marketingOptOut: boolean;
  createdAt: string | null;
  devices: DeviceRow[];
};

const INTEREST_LABELS: Record<string, string> = { 'band-design': 'Band design', stickers: 'Stickers', 'team-cards': 'Cards for my team' };
const SOURCE_LABELS: Record<string, string> = { 'join-list': 'Join the list', 'band-design': 'Help design the band' };
type StatusFilter = 'all' | 'lead' | 'customer';

export default function OwnerClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [interest, setInterest] = useState('');
  const shown = clients.filter((c) => (statusFilter === 'all' || c.status === statusFilter) && (!interest || c.interests.includes(interest)));
  const counts = { all: clients.length, lead: clients.filter((c) => c.status === 'lead').length, customer: clients.filter((c) => c.status === 'customer').length };

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
          Sign-ups, buyers, and who claimed a Boop. One list.
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

        <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filter clients">
          {(['all', 'lead', 'customer'] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={statusFilter === f}
              onClick={() => setStatusFilter(f)}
              className={`min-h-11 rounded-full px-4 text-sm font-bold ${statusFilter === f ? 'bg-white text-black' : 'bg-zinc-800 text-white/70'}`}
            >
              {f === 'all' ? 'All' : f === 'lead' ? 'Leads' : 'Customers'} · {counts[f]}
            </button>
          ))}
          <label className="sr-only" htmlFor="interest-filter">Interest</label>
          <select
            id="interest-filter"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className="min-h-11 rounded-full bg-zinc-800 px-4 text-sm text-white"
          >
            <option value="">Any interest</option>
            {Object.entries(INTEREST_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download from an API route, not a page */}
          <a href="/api/owner/clients?format=csv" download className="ml-auto inline-flex min-h-11 items-center rounded-full bg-[#E72679] px-4 text-sm font-bold text-white">
            Export CSV
          </a>
        </div>

        <div className="mt-4 space-y-4">
          {shown.length === 0 && (
            <p className="text-sm text-white/40">{clients.length === 0 ? 'No clients yet. They appear when someone signs up, buys, or claims a card.' : 'Nobody matches this filter.'}</p>
          )}
          {shown.map((c) => (
            <div key={c.email} className="min-w-0 rounded-2xl bg-zinc-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  {c.name && <p className="text-lg font-bold">{c.name}</p>}
                  <p className="break-all font-medium text-white/90">{c.email}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${c.status === 'customer' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-[#E72679]/20 text-pink-300'}`}>
                  {c.status === 'customer' ? 'Customer' : 'Lead'}
                </span>
              </div>
              <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex gap-2"><dt className="text-white/40">Profile</dt><dd className="min-w-0 break-all">{c.username ? <a href={`/${c.username}`} className="underline">@{c.username}</a> : 'none yet'}</dd></div>
                {c.phone && <div className="flex gap-2"><dt className="text-white/40">Phone</dt><dd>{c.phone}{c.textConsent ? ' · OK to text' : ' · no texts'}</dd></div>}
                {c.sources.length > 0 && <div className="flex gap-2"><dt className="text-white/40">Signed up via</dt><dd>{c.sources.map((x) => SOURCE_LABELS[x] || x).join(', ')}</dd></div>}
                {c.consentAt && <div className="flex gap-2"><dt className="text-white/40">Email OK</dt><dd>{new Date(c.consentAt).toLocaleDateString()}</dd></div>}
                {c.marketingOptOut && <div className="flex gap-2"><dt className="text-white/40">Opted out</dt><dd>Do not contact</dd></div>}
              </dl>
              {c.interests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.interests.map((i) => (
                    <span key={i} className="rounded-full bg-zinc-800 px-3 py-1 text-xs">{INTEREST_LABELS[i] || i}</span>
                  ))}
                </div>
              )}
              {c.devices.length === 0 ? (
                <p className="mt-3 text-sm text-white/40">No codes attached</p>
              ) : (
                <div className="mt-3 space-y-2">
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
