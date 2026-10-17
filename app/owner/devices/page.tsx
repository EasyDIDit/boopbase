'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NfcWritePanel from '@/components/NfcWritePanel';

type DeviceRow = {
  _id: string;
  code: string;
  productType: string;
  status: string;
  ownerUsername?: string;
  orderEmail?: string;
  programmedUrl?: string;
  chipWrittenAt?: string;
  chipLocked?: boolean;
  createdAt?: string;
};

type Filter = 'all' | 'ready' | 'claimed';

export default function OwnerDevicesPage() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [productType, setProductType] = useState('card');
  const [code, setCode] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [ownerUsername, setOwnerUsername] = useState('');
  const [message, setMessage] = useState('');
  const [lastUrl, setLastUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [lastCode, setLastCode] = useState('');
  const [batch, setBatch] = useState(false);
  const [writingCode, setWritingCode] = useState('');

  const load = async () => {
    const res = await fetch('/api/devices');
    const data = await res.json();
    if (!res.ok) {
      setSignedOut(true);
      setMessage(data.error || 'Sign in as the shop owner first');
      setDevices([]);
      return;
    }
    setSignedOut(false);
    setDevices(data.devices || []);
    setMessage('');
  };

  useEffect(() => {
    load();
  }, []);

  const mint = async () => {
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productType,
        code,
        orderEmail,
        ownerUsername,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (res.status === 403) setSignedOut(true);
      setMessage(data.error || 'Could not create code');
      return;
    }
    setLastUrl(data.programmedUrl);
    setLastCode(data.code);
    setMessage(`${data.productType} ${data.code} is ${data.status}`);
    setCode('');
    load();
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Copied');
    } catch {
      setMessage(text);
    }
  };

  const counts = useMemo(() => {
    const ready = devices.filter((d) => d.status !== 'claimed').length;
    const claimed = devices.filter((d) => d.status === 'claimed').length;
    return { all: devices.length, ready, claimed };
  }, [devices]);

  const visible = devices.filter((d) => {
    if (filter === 'ready') return d.status !== 'claimed';
    if (filter === 'claimed') return d.status === 'claimed';
    return true;
  });

  if (signedOut) {
    return (
      <div className="min-h-screen bg-zinc-950 px-5 py-10 text-white">
        <div className="mx-auto max-w-md text-center">
          <p className="text-xs tracking-[4px] text-white/40">MINT</p>
          <h1 className="mt-3 text-3xl font-bold">Sign in to mint</h1>
          <p className="mt-3 text-white/60">
            This page is locked. Sign in as peasy1 and you will land back here with every minted code.
          </p>
          <Link
            href="/login?next=/owner/devices"
            className="mt-8 flex min-h-14 items-center justify-center rounded-2xl bg-white text-lg font-bold text-black"
          >
            Sign in to mint
          </Link>
          <p className="mt-6 text-sm text-white/40">
            Use www.boopbase.com on the phone. Do not open the bare boopbase.com link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs tracking-[4px] text-white/40">MINT</p>
        <h1 className="mt-2 text-3xl font-bold">Boop codes</h1>
        <p className="mt-2 text-sm text-white/60">
          Make a code, write only this URL on the chip, then pack it.
        </p>
        <div className="mt-4 flex gap-3 text-sm">
          <Link href="/owner/clients" className="underline text-white/70">
            Clients who claimed
          </Link>
        </div>

        <div className="mt-6 grid gap-3 rounded-3xl bg-zinc-900 p-4 sm:grid-cols-2 sm:p-6">
          <label className="block">
            <span className="text-sm text-white/50">Product</span>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="mt-2 block min-h-12 w-full rounded-xl bg-zinc-800 px-4 py-3"
            >
              <option value="card">Card</option>
              <option value="band">Band</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-white/50">Custom code (optional)</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="mt-2 block min-h-12 w-full rounded-xl bg-zinc-800 px-4 py-3 font-mono"
              placeholder="leave blank for random"
              autoCapitalize="characters"
            />
          </label>
          <button
            onClick={mint}
            disabled={loading}
            className="min-h-14 rounded-xl bg-white font-bold text-black disabled:opacity-50 sm:col-span-2"
          >
            {loading ? 'Making…' : `Make ${productType}`}
          </button>
          <label className="flex items-center gap-2 text-sm text-white/60 sm:col-span-2">
            <input type="checkbox" checked={batch} onChange={(e) => setBatch(e.target.checked)} />
            Batch: after a card is written, make the next code automatically
          </label>
        </div>

        {lastUrl && (
          <div className="mt-4 rounded-3xl border border-emerald-700 bg-emerald-950 p-5">
            <p className="mb-2 text-sm text-emerald-300">Write this on the chip</p>
            <p className="break-all font-mono text-lg">{lastUrl}</p>
            <button
              onClick={() => copy(lastUrl)}
              className="mt-4 min-h-12 w-full rounded-xl bg-emerald-400 font-bold text-black"
            >
              Copy URL
            </button>
            {lastCode && (
              <NfcWritePanel
                key={lastCode}
                code={lastCode}
                url={lastUrl}
                onWritten={() => {
                  load();
                  if (batch) mint();
                }}
              />
            )}
          </div>
        )}

        {message && <p className="mt-4 text-yellow-300">{message}</p>}

        <div className="mt-8 flex gap-2 text-sm">
          {(['all', 'ready', 'claimed'] as Filter[]).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`min-h-10 flex-1 rounded-xl px-3 py-2 capitalize ${
                filter === key ? 'bg-white text-black' : 'bg-zinc-800 text-white/70'
              }`}
            >
              {key} {counts[key]}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {visible.length === 0 && (
            <p className="text-sm text-white/40">No codes in this list yet.</p>
          )}
          {visible.map((d) => (
            <div key={d._id} className="rounded-2xl bg-zinc-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-2xl">{d.code}</p>
                  <p className="mt-1 text-sm text-white/50">
                    {d.productType} · {d.status === 'claimed' ? 'claimed' : 'ready'}
                    {d.ownerUsername ? ` · @${d.ownerUsername}` : ''}
                    {d.orderEmail ? ` · ${d.orderEmail}` : ''}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    d.status === 'claimed'
                      ? 'bg-emerald-400/20 text-emerald-300'
                      : 'bg-white/10 text-white/70'
                  }`}
                >
                  {d.status === 'claimed' ? 'Claimed' : 'Ready'}
                </span>
              </div>
              {d.programmedUrl && (
                <button
                  onClick={() => copy(d.programmedUrl || '')}
                  className="mt-3 min-h-11 w-full rounded-xl bg-zinc-800 text-sm font-semibold"
                >
                  Copy chip URL
                </button>
              )}
              {d.chipWrittenAt && (
                <p className="mt-2 text-xs text-sky-200/80">
                  Chip written {new Date(d.chipWrittenAt).toLocaleString()}
                  {d.chipLocked ? ' · locked' : ''}
                </p>
              )}
              {d.programmedUrl && d.status === 'ready' && !d.ownerUsername && !d.chipLocked && (
                writingCode === d.code ? (
                  <NfcWritePanel code={d.code} url={d.programmedUrl} onWritten={() => load()} />
                ) : (
                  <button
                    onClick={() => setWritingCode(d.code)}
                    className="mt-2 min-h-11 w-full rounded-xl border border-sky-300/40 text-sm font-semibold text-sky-200"
                  >
                    Write to card
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
