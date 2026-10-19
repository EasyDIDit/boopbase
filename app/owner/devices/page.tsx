'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ShortfallNotice from '@/components/ShortfallNotice';
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
  onlineStock?: boolean;
  color?: string;
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
  const [color, setColor] = useState('');
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

  const release = async (d: DeviceRow) => {
    if (!d.ownerUsername) return;
    const ok = window.confirm(
      `Release card ${d.code} from @${d.ownerUsername}?\n\n` +
        `Their account and profile are kept, but this card will no longer open it.\n` +
        `The card keeps the same code and goes back to your in-person ready stock. Tapping it will start a fresh claim.`
    );
    if (!ok) return;
    const res = await fetch('/api/owner/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: d.code, expectOwner: d.ownerUsername }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? `${data.released} released from @${data.previousOwner}. It is ready stock again.` : data.error || 'Could not release');
    if (res.ok) load();
  };

  const setColorFor = async (codes: string[], c: string) => {
    if (!codes.length) return;
    const res = await fetch('/api/owner/device-color', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes, color: c }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? `${data.updated} card(s) set to ${c || 'no color'}` : data.error || 'Could not set color');
    if (res.ok) load();
  };

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
    // Keep the last action's message (e.g. "released", "moved to online stock") so EASY sees it.
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
        color,
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
    setMessage(`${data.color ? `${data.color} ` : ''}${data.productType} ${data.code} is ${data.status}`);
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

  const field = 'mt-1 block min-h-12 w-full rounded-xl bg-zinc-800 px-3 text-base';
  const small = 'min-h-11 rounded-xl px-3 text-sm font-semibold';
  const scrollToWriter = () => document.getElementById('writer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 text-white">
      {/* Sticky action bar: always reachable on a phone */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2 sm:px-6">
          <button
            onClick={mint}
            disabled={loading}
            className="min-h-12 flex-1 rounded-xl bg-white px-3 text-base font-bold text-black disabled:opacity-50"
          >
            {loading ? 'Making…' : `Make ${color ? `${color} ` : ''}${productType}`}
          </button>
          {lastCode && (
            <button
              onClick={scrollToWriter}
              className="min-h-12 flex-1 rounded-xl bg-sky-300 px-3 text-base font-bold text-black"
            >
              Write + lock {lastCode}
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs tracking-[4px] text-white/40">MINT</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Boop codes</h1>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Link
            href="/owner/clients"
            className="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-zinc-800 px-3 text-sm font-semibold text-white/80"
          >
            Clients
          </Link>
          <Link
            href="/owner/mailing-list"
            className="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-zinc-800 px-3 text-sm font-semibold text-white/80"
          >
            Mailing list
          </Link>
          </div>
        </div>
        <p className="mt-2 text-sm text-white/60">Make a code, write only this URL on the chip, then pack it.</p>
        <div className="mt-4">
          <ShortfallNotice />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-3xl bg-zinc-900 p-4 sm:grid-cols-3 sm:p-6">
          <label className="block min-w-0">
            <span className="text-sm text-white/50">Product</span>
            <select value={productType} onChange={(e) => setProductType(e.target.value)} className={field}>
              <option value="card">Card</option>
              <option value="band">Band</option>
            </select>
          </label>
          <label className="block min-w-0">
            <span className="text-sm text-white/50">Color</span>
            <select value={color} onChange={(e) => setColor(e.target.value)} className={field}>
              <option value="">Not set</option>
              <option value="black">Black</option>
              <option value="white">White</option>
            </select>
          </label>
          <label className="col-span-2 block min-w-0 sm:col-span-1">
            <span className="text-sm text-white/50">Custom code (optional)</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className={`${field} font-mono`}
              placeholder="blank = random"
              autoCapitalize="characters"
            />
          </label>
          <p className="col-span-2 text-xs text-white/40 sm:col-span-3">Black and White are separate stock.</p>
          <button
            onClick={mint}
            disabled={loading}
            className="col-span-2 min-h-14 rounded-xl bg-white text-base font-bold text-black disabled:opacity-50 sm:col-span-3"
          >
            {loading ? 'Making…' : `Make ${productType}`}
          </button>
          <label className="col-span-2 flex min-h-11 items-center gap-3 text-sm text-white/70 sm:col-span-3">
            <input type="checkbox" className="h-5 w-5 shrink-0" checked={batch} onChange={(e) => setBatch(e.target.checked)} />
            Batch: after a card is written + locked, make the next code
          </label>
        </div>

        {lastUrl && (
          <div id="writer" className="mt-4 scroll-mt-20 rounded-3xl border border-emerald-700 bg-emerald-950 p-4 sm:p-5">
            <p className="mb-1 text-sm text-emerald-300">Write this on the chip</p>
            <p className="break-all font-mono text-base sm:text-lg">{lastUrl}</p>
            <button onClick={() => copy(lastUrl)} className="mt-3 min-h-12 w-full rounded-xl bg-emerald-400 font-bold text-black">
              Copy URL
            </button>
            {lastCode && (
              <NfcWritePanel
                key={lastCode}
                code={lastCode}
                url={lastUrl}
                onWritten={(_c, info) => {
                  load();
                  // Batch: next code only after a fully locked card; a lock failure stops so EASY can tap Lock.
                  if (batch && info.complete) mint();
                }}
              />
            )}
          </div>
        )}

        {message && <p role="status" className="mt-4 break-words text-yellow-300">{message}</p>}

        {/* Filters: horizontally scrollable chips */}
        <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist">
          {(['all', 'ready', 'claimed', 'handed'] as Filter[]).map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={`min-h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold capitalize ${
                filter === key ? 'bg-white text-black' : 'bg-zinc-800 text-white/70'
              }`}
            >
              {key === 'handed' ? 'Handed out, unclaimed' : key} · {counts[key]}
            </button>
          ))}
        </div>

        {picked.length > 0 && (
          <div className="mt-3 rounded-2xl bg-zinc-900 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{picked.length} selected</span>
              <button onClick={() => setPicked([])} className="min-h-11 px-2 text-white/60 underline">Clear</button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button onClick={() => setOnline(picked, true)} className={`${small} bg-sky-300 text-black`}>Online stock</button>
              <button onClick={() => setOnline(picked, false)} className={`${small} bg-zinc-700`}>In-person</button>
              <button onClick={() => setColorFor(picked, 'black')} className={`${small} bg-zinc-700`}>Set Black</button>
              <button onClick={() => setColorFor(picked, 'white')} className={`${small} bg-zinc-700`}>Set White</button>
            </div>
          </div>
        )}
        <p className="mt-3 text-xs text-white/40">Web orders only use cards in online stock. Everything else stays your in-person stock.</p>

        <div className="mt-3 space-y-3">
          {visible.length === 0 && <p className="text-sm text-white/40">No codes in this list yet.</p>}
          {visible.map((d) => {
            const canSale = d.saleChannel !== 'online' && d.status !== 'disabled';
            const stock = isInStock(d);
            return (
              <div key={d._id} className="rounded-2xl bg-zinc-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 break-all font-mono text-xl sm:text-2xl">{d.code}</p>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      d.status === 'claimed' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {d.status === 'claimed' ? 'Claimed' : 'Ready'}
                  </span>
                </div>
                <p className="mt-1 break-words text-sm text-white/60">
                  {d.color ? `${d.color} ` : ''}
                  {d.productType}
                  {d.ownerUsername ? ` · @${d.ownerUsername}` : ''}
                  {d.orderEmail && filter !== 'handed' ? ` · ${d.orderEmail}` : ''}
                  {filter === 'handed' && d.soldAt ? ` · handed out ${new Date(d.soldAt).toLocaleDateString()}` : ''}
                  {stock && d.onlineStock ? ' · online stock' : ''}
                  {d.saleType ? ` · ${d.saleType}` : ''}
                </p>
                {d.ownerNote && <p className="mt-1 break-words text-xs text-white/40">Note: {d.ownerNote}</p>}
                {d.chipWrittenAt && (
                  <p className="mt-1 text-xs text-sky-200/80">
                    Chip written {new Date(d.chipWrittenAt).toLocaleString()}
                    {d.chipLocked ? ' · locked' : ' · not locked'}
                  </p>
                )}

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {d.programmedUrl && (
                    <button onClick={() => copy(d.programmedUrl || '')} className="min-h-12 w-full rounded-xl bg-zinc-800 text-sm font-semibold">
                      Copy chip URL
                    </button>
                  )}
                  {d.programmedUrl && d.status === 'ready' && !d.ownerUsername && !d.chipLocked && writingCode !== d.code && (
                    <button
                      onClick={() => setWritingCode(d.code)}
                      className="min-h-12 w-full rounded-xl border border-sky-300/40 text-sm font-semibold text-sky-200"
                    >
                      Write + lock card
                    </button>
                  )}
                  {d.chipWrittenAt && !d.chipLocked && d.programmedUrl && !(d.status === 'ready' && !d.ownerUsername) && writingCode !== d.code && (
                    <button
                      onClick={() => setWritingCode(d.code)}
                      className="min-h-12 w-full rounded-xl border border-amber-300/40 text-sm font-semibold text-amber-200"
                    >
                      Lock card
                    </button>
                  )}
                </div>
                {writingCode === d.code && d.programmedUrl && !d.chipLocked && (
                  d.status === 'ready' && !d.ownerUsername ? (
                    <NfcWritePanel code={d.code} url={d.programmedUrl} alreadyWritten={!!d.chipWrittenAt} onWritten={() => load()} />
                  ) : d.chipWrittenAt ? (
                    <NfcWritePanel code={d.code} url={d.programmedUrl} lockOnly onWritten={() => load()} />
                  ) : null
                )}

                {(canSale || stock || d.ownerUsername) && (
                  <details className="group mt-2 rounded-xl bg-zinc-950/40">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl px-3 text-sm font-semibold text-white/70">
                      <span>More: {[stock && 'stock', stock && 'color', canSale && 'sale', d.ownerUsername && 'release'].filter(Boolean).join(', ')}</span>
                      <span className="transition-transform group-open:rotate-180" aria-hidden>▾</span>
                    </summary>
                    <div className="grid gap-3 p-3 pt-1 sm:grid-cols-2">
                      {stock && (
                        <>
                          <label className="flex min-h-11 items-center gap-3 text-sm text-white/70">
                            <input
                              type="checkbox"
                              className="h-5 w-5 shrink-0"
                              checked={picked.includes(d.code)}
                              onChange={(e) => setPicked((p) => (e.target.checked ? [...p, d.code] : p.filter((c) => c !== d.code)))}
                            />
                            Select for bulk actions
                          </label>
                          <button
                            onClick={() => setOnline([d.code], !d.onlineStock)}
                            className={`${small} ${d.onlineStock ? 'bg-sky-300/20 text-sky-200' : 'bg-zinc-800 text-white/70'}`}
                          >
                            {d.onlineStock ? 'Online stock ✓' : 'Make online stock'}
                          </button>
                          <label className="block text-sm text-white/50">
                            Color
                            <select value={d.color || ''} onChange={(e) => setColorFor([d.code], e.target.value)} className={field} aria-label="Card color">
                              <option value="">Not set</option>
                              <option value="black">Black</option>
                              <option value="white">White</option>
                            </select>
                          </label>
                        </>
                      )}
                      {canSale && (
                        <>
                          <label className="block text-sm text-white/50">
                            Sale type
                            <select
                              value={d.saleType || ''}
                              onChange={(e) => saveSaleInfo(d, e.target.value, d.ownerNote || '')}
                              className={field}
                              aria-label="In-person sale type"
                            >
                              <option value="">Not set</option>
                              <option value="sale">Sale</option>
                              <option value="giveaway">Giveaway</option>
                            </select>
                          </label>
                          <label className="block text-sm text-white/50 sm:col-span-2">
                            Private note (who / phone)
                            <input
                              defaultValue={d.ownerNote || ''}
                              placeholder="Only you see this"
                              onBlur={(e) => {
                                if (e.target.value.trim() !== (d.ownerNote || '')) saveSaleInfo(d, d.saleType || '', e.target.value);
                              }}
                              className={field}
                            />
                          </label>
                        </>
                      )}
                      {d.ownerUsername && (
                        <button onClick={() => release(d)} className={`${small} bg-red-400/15 text-red-200 sm:col-span-2`}>
                          Release card from @{d.ownerUsername}
                        </button>
                      )}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
