'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type DeviceRow = {
  _id: string;
  code: string;
  productType: string;
  status: string;
  ownerUsername?: string;
  orderEmail?: string;
  programmedUrl?: string;
};

export default function OwnerDevicesPage() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [productType, setProductType] = useState('card');
  const [code, setCode] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [ownerUsername, setOwnerUsername] = useState('');
  const [message, setMessage] = useState('');
  const [lastUrl, setLastUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch('/api/devices');
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Sign in as the shop owner first');
      setDevices([]);
      return;
    }
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
      setMessage(data.error || 'Could not create code');
      return;
    }
    setLastUrl(data.programmedUrl);
    setMessage(`${data.productType} ${data.code} is ${data.status}`);
    setCode('');
    load();
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setMessage('Copied');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs tracking-[4px] text-white/40 mb-3">OWNER</p>
        <h1 className="text-4xl font-bold mb-2">Boop codes</h1>
        <p className="text-white/60 mb-4">
          Make a code, write only this URL on the chip, then attach it to a client.
        </p>
        <p className="text-white/40 text-sm mb-8">
          <Link href="/owner/clients" className="underline">
            Client list
          </Link>
        </p>

        <div className="bg-zinc-900 rounded-3xl p-6 mb-8 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-white/50">Product</span>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="block mt-2 w-full bg-zinc-800 rounded-xl px-4 py-3"
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
              className="block mt-2 w-full bg-zinc-800 rounded-xl px-4 py-3 font-mono"
              placeholder="PEASY2"
            />
          </label>
          <label className="block">
            <span className="text-sm text-white/50">Purchase email (optional)</span>
            <input
              value={orderEmail}
              onChange={(e) => setOrderEmail(e.target.value)}
              className="block mt-2 w-full bg-zinc-800 rounded-xl px-4 py-3"
              placeholder="buyer@email.com"
            />
          </label>
          <label className="block">
            <span className="text-sm text-white/50">Profile username (optional)</span>
            <input
              value={ownerUsername}
              onChange={(e) => setOwnerUsername(e.target.value.toLowerCase())}
              className="block mt-2 w-full bg-zinc-800 rounded-xl px-4 py-3"
              placeholder="peasy1"
            />
          </label>
          <button
            onClick={mint}
            disabled={loading}
            className="sm:col-span-2 bg-white text-black font-bold rounded-xl px-6 py-3 disabled:opacity-50"
          >
            {loading ? 'Making…' : 'Make code'}
          </button>
        </div>

        {lastUrl && (
          <div className="bg-emerald-950 border border-emerald-700 rounded-3xl p-6 mb-8">
            <p className="text-sm text-emerald-300 mb-2">Write this on the chip</p>
            <p className="font-mono break-all text-lg">{lastUrl}</p>
            <button
              onClick={() => copy(lastUrl)}
              className="mt-4 underline text-emerald-200"
            >
              Copy URL
            </button>
          </div>
        )}

        {message && <p className="mb-6 text-yellow-300">{message}</p>}

        <div className="space-y-3">
          {devices.map((d) => (
            <div key={d._id} className="bg-zinc-900 rounded-2xl p-4 flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-mono text-xl">{d.code}</p>
                <p className="text-white/50 text-sm">
                  {d.productType} · {d.status}
                  {d.ownerUsername ? ` · @${d.ownerUsername}` : ''}
                  {d.orderEmail ? ` · ${d.orderEmail}` : ''}
                </p>
              </div>
              {d.programmedUrl && (
                <button onClick={() => copy(d.programmedUrl || '')} className="underline text-sm">
                  Copy URL
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
