'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ShortfallNotice from '@/components/ShortfallNotice';

type DeviceRow = {
  _id: string;
  code: string;
  productType: string;
  status: string;
  ownerUsername?: string;
  orderEmail?: string;
  programmedUrl?: string;
  onlineStock?: boolean;
  saleType?: string;
  ownerNote?: string;
  saleChannel?: string;
  soldAt?: string;
  createdAt?: string;
};

type Filter = 'all' | 'ready' | 'claimed' | 'handed';

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
  const [picked, setPicked] = useState<string[]>([]);

  const saveSaleInfo = async (d: DeviceRow, saleType: string, ownerNote: string) => {
    if (d.status === 'ready' && saleType && !window.confirm(`Mark ${d.code} as handed out (${saleType})? It leaves ready stock.`)) return;
    const res = await fetch('/api/owner/sale-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: d.code, saleType, ownerNote }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? `${d.code}: ${data.saleType || 'type cleared'}${data.ownerNote ? ` · ${data.ownerNote}` : ''}` : data.error || 'Could not save');
    if (res.ok) load();
  };

  const isInStock = (d: DeviceRow) => d.status === 'ready' && !d.ownerUsername;

  const setOnline = async (codes: string[], online: boolean) => {
    if (!codes.length) return;
    const res = await fetch('/api/owner/online-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes, online }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || 'Could not update online stock');
      return;
    }
    setMessage(`${data.updated} card(s) ${online ? 'moved to online stock' : 'back to in-person stock'}`);
    setPicked([]);
    load();
  };

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
    const handed = devices.filter((d) => d.status === 'sold' && !d.ownerUsername).length;
    return { all: devices.length, ready, claimed, handed };
  }, [devices]);

  const visible = devices.filter((d) => {
    if (filter === 'ready') return d.status !== 'claimed';
    if (filter === 'claimed') return d.status === 'claimed';
    if (filter === 'handed') return d.status === 'sold' && !d.ownerUsername;
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
        <div className="mt-4"><ShortfallNotice /></div>
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
          </div>
        )}

        {message && <p className="mt-4 text-yellow-300">{message}</p>}

        <div className="mt-8 flex gap-2 text-sm">
          {(['all', 'ready', 'claimed', 'handed'] as Filter[]).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`min-h-10 flex-1 rounded-xl px-3 py-2 capitalize ${
                filter === key ? 'bg-white text-black' : 'bg-zinc-800 text-white/70'
              }`}
            >
              {key === 'handed' ? 'Handed out, unclaimed' : key} {counts[key]}
            </button>
          ))}
        </div>

        {picked.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-zinc-900 p-3 text-sm">
            <span className="font-semibold">{picked.length} selected</span>
            <button onClick={() => setOnline(picked, true)} className="rounded-xl bg-sky-300 px-3 py-2 font-bold text-black">
              Move to online stock
            </button>
            <button onClick={() => setOnline(picked, false)} className="rounded-xl bg-zinc-700 px-3 py-2 font-semibold">
              Back to in-person
            </button>
            <button onClick={() => setPicked([])} className="ml-auto text-white/60 underline">Clear</button>
          </div>
        )}
        <p className="mt-3 text-xs text-white/40">
          Web orders only use cards in online stock. Everything else stays your in-person stock.
        </p>

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
                    {d.orderEmail && filter !== 'handed' ? ` · ${d.orderEmail}` : ''}
                    {filter === 'handed' && d.soldAt ? ` · handed out ${new Date(d.soldAt).toLocaleDateString()}` : ''}
                    {isInStock(d) && d.onlineStock ? ' · online stock' : ''}
                    {d.saleType ? ` · ${d.saleType}` : ''}
                  </p>
                  {d.saleChannel !== 'online' && d.status !== 'disabled' && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <select
                        value={d.saleType || ''}
                        onChange={(e) => saveSaleInfo(d, e.target.value, d.ownerNote || '')}
                        className="rounded-lg bg-zinc-800 px-2 py-1"
                        aria-label="In-person sale type"
                      >
                        <option value="">Sale type…</option>
                        <option value="sale">Sale</option>
                        <option value="giveaway">Giveaway</option>
                      </select>
                      <input
                        defaultValue={d.ownerNote || ''}
                        placeholder="Note: who / phone (private)"
                        onBlur={(e) => {
                          if (e.target.value.trim() !== (d.ownerNote || '')) saveSaleInfo(d, d.saleType || '', e.target.value);
                        }}
                        className="min-w-0 flex-1 rounded-lg bg-zinc-800 px-2 py-1"
                      />
                    </div>
                  )}
                  {isInStock(d) && (
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1 text-white/60">
                        <input
                          type="checkbox"
                          checked={picked.includes(d.code)}
                          onChange={(e) =>
                            setPicked((p) => (e.target.checked ? [...p, d.code] : p.filter((c) => c !== d.code)))
                          }
                        />
                        Select
                      </label>
                      <button
                        onClick={() => setOnline([d.code], !d.onlineStock)}
                        className={`rounded-full px-2 py-1 font-semibold ${d.onlineStock ? 'bg-sky-300/20 text-sky-200' : 'bg-zinc-800 text-white/60'}`}
                      >
                        {d.onlineStock ? 'Online stock ✓' : 'Make online stock'}
                      </button>
                    </div>
                  )}
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
