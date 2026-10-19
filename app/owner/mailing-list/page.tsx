'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Sub = {
  email: string;
  name: string;
  phone: string;
  interests: string[];
  sources: string[];
  emailConsent: boolean;
  consentAt: string | null;
  textConsent: boolean;
  isCustomer: boolean;
  customerSince: string | null;
  createdAt: string | null;
};

const INTEREST_LABELS: Record<string, string> = { 'band-design': 'Band design', stickers: 'Stickers', 'team-cards': 'Cards for my team' };
const SOURCE_LABELS: Record<string, string> = {
  'join-list': 'Join the list',
  'band-design': 'Help design the band',
  purchase: 'Bought online',
  claim: 'Claimed a card',
  in_person: 'In-person sale',
};
type Filter = 'all' | 'customers' | 'signups';

export default function MailingListPage() {
  const [subs, setSubs] = useState<Sub[] | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [interest, setInterest] = useState('');

  useEffect(() => {
    let live = true;
    fetch('/api/owner/mailing-list')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!live) return;
        if (!res.ok) setSignedOut(true);
        else setSubs(data.subscribers || []);
      })
      .catch(() => live && setSignedOut(true));
    return () => {
      live = false;
    };
  }, []);

  if (signedOut) {
    return (
      <div className="min-h-screen bg-zinc-950 px-5 py-10 text-white">
        <div className="mx-auto max-w-md text-center">
          <p className="text-xs tracking-[4px] text-white/40">MINT</p>
          <h1 className="mt-3 text-3xl font-bold">Sign in to see the mailing list</h1>
          <Link href="/login?next=/owner/mailing-list" className="mt-8 flex min-h-14 items-center justify-center rounded-2xl bg-white text-lg font-bold text-black">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const all = subs || [];
  const counts = { all: all.length, customers: all.filter((s) => s.isCustomer).length, signups: all.filter((s) => !s.isCustomer).length };
  const shown = all.filter(
    (s) => (filter === 'all' || (filter === 'customers' ? s.isCustomer : !s.isCustomer)) && (!interest || s.interests.includes(interest))
  );
  const noConsent = shown.filter((s) => !s.emailConsent).length;

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs tracking-[4px] text-white/40">MINT</p>
        <h1 className="mt-2 text-3xl font-bold">Mailing list</h1>
        <p className="mt-2 text-sm text-white/60">Sign-ups from the Boop page, plus everyone who bought or claimed a card. Use Customers for thank-you gifts.</p>
        <p className="mt-4 flex gap-4 text-sm">
          <Link href="/owner/devices" className="underline text-white/70">Mint codes</Link>
          <Link href="/owner/clients" className="underline text-white/70">Clients</Link>
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filter mailing list">
          {(['all', 'customers', 'signups'] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`min-h-11 rounded-full px-4 text-sm font-bold ${filter === f ? 'bg-white text-black' : 'bg-zinc-800 text-white/70'}`}
            >
              {f === 'all' ? 'All' : f === 'customers' ? 'Customers' : 'Sign-ups only'} · {counts[f]}
            </button>
          ))}
          <label className="sr-only" htmlFor="ml-interest">Interest</label>
          <select id="ml-interest" value={interest} onChange={(e) => setInterest(e.target.value)} className="min-h-11 rounded-full bg-zinc-800 px-4 text-sm text-white">
            <option value="">Any interest</option>
            {Object.entries(INTEREST_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download from an API route, not a page */}
          <a href="/api/owner/mailing-list?format=csv" download className="ml-auto inline-flex min-h-11 items-center rounded-full bg-[#E72679] px-4 text-sm font-bold text-white">
            Export CSV
          </a>
        </div>
        {noConsent > 0 && (
          <p className="mt-3 rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            {noConsent}{' '}{noConsent === 1 ? 'person has' : 'people have'}{' '}not opted in to marketing email. Gifts are fine; don&apos;t add them to newsletters.
          </p>
        )}

        <div className="mt-4 space-y-4">
          {subs === null && <p className="text-sm text-white/40">Loading…</p>}
          {subs !== null && shown.length === 0 && <p className="text-sm text-white/40">{all.length === 0 ? 'Nobody on the list yet.' : 'Nobody matches this filter.'}</p>}
          {shown.map((s) => (
            <div key={s.email} className="min-w-0 rounded-2xl bg-zinc-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  {s.name && <p className="text-lg font-bold">{s.name}</p>}
                  <p className="break-all text-white/90">{s.email}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${s.isCustomer ? 'bg-emerald-400/15 text-emerald-300' : 'bg-[#E72679]/20 text-pink-300'}`}>
                    {s.isCustomer ? 'Customer' : 'Sign-up'}
                  </span>
                  {!s.emailConsent && <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-300">No email consent</span>}
                </div>
              </div>
              <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                {s.phone && <div className="flex gap-2"><dt className="text-white/40">Phone</dt><dd>{s.phone}{s.textConsent ? ' · OK to text' : ' · no texts'}</dd></div>}
                {s.sources.length > 0 && <div className="flex gap-2"><dt className="text-white/40">From</dt><dd>{s.sources.map((x) => SOURCE_LABELS[x] || x).join(', ')}</dd></div>}
                {s.consentAt && <div className="flex gap-2"><dt className="text-white/40">Email OK</dt><dd>{new Date(s.consentAt).toLocaleDateString()}</dd></div>}
                {s.customerSince && <div className="flex gap-2"><dt className="text-white/40">Customer since</dt><dd>{new Date(s.customerSince).toLocaleDateString()}</dd></div>}
              </dl>
              {s.interests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.interests.map((i) => (
                    <span key={i} className="rounded-full bg-zinc-800 px-3 py-1 text-xs">{INTEREST_LABELS[i] || i}</span>
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
