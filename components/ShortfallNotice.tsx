'use client';

import { useEffect, useState } from 'react';

type ByColor = { color: string; owed: number };
type Row = {
  orderId: string;
  email: string;
  quantity: number;
  shortfall: number;
  toMake: number;
  owedByColor: ByColor[];
  toMakeByColor: ByColor[];
  createdAt: string;
  livemode: boolean;
};

const colorWord = (c: string) => (c ? c[0].toUpperCase() + c.slice(1) : 'Any color');
const list = (xs: ByColor[]) => xs.map((x) => `${x.owed} ${colorWord(x.color)}`).join(', ');

/**
 * Owner notices on /owner/devices:
 * - Stock short: paid orders still owed cards of a color (online stock ran out). "Assign" fills from online stock.
 * - To make: logo cards printed fresh per order. Print + program a card here, then link it to the order.
 */
export default function ShortfallNotice() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const load = async () => {
    const res = await fetch('/api/owner/shortfalls');
    if (res.ok) setRows((await res.json()).orders || []);
  };
  useEffect(() => {
    let live = true;
    fetch('/api/owner/shortfalls')
      .then((res) => (res.ok ? res.json() : { orders: [] }))
      .then((d) => live && setRows(d.orders || []))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  if (!rows.length && !msg) return null;
  const short = rows.filter((r) => r.shortfall > 0);
  const make = rows.filter((r) => r.toMake > 0);
  const owed = short.reduce((n, r) => n + r.shortfall, 0);
  const toMake = make.reduce((n, r) => n + r.toMake, 0);

  const fill = async () => {
    setBusy(true);
    const res = await fetch('/api/owner/shortfalls', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(data.error || 'Could not fill');
    const n = (data.filled || []).reduce((a: number, f: { assigned: number }) => a + f.assigned, 0);
    setMsg(n ? `Assigned ${n} card(s) from online stock and emailed the buyers their links.` : 'No online stock in the needed color(s). Make cards, set their color, and mark them online stock first.');
    load();
  };

  const link = async (orderId: string) => {
    const code = (codes[orderId] || '').trim();
    if (!code) return setMsg('Type the code of the logo card you just made.');
    setBusy(true);
    const res = await fetch('/api/owner/shortfalls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'link', orderId, code }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? `Linked ${data.linked} to the order and emailed the buyer its setup link.` : data.error || 'Could not link');
    if (res.ok) {
      setCodes((c) => ({ ...c, [orderId]: '' }));
      load();
    }
  };

  return (
    <div className="space-y-3">
      {short.length > 0 && (
        <div role="alert" className="rounded-2xl border border-amber-400/60 bg-amber-400/10 p-4 text-sm">
          <p className="font-bold">Stock short: {owed} card(s) owed on {short.length} order(s)</p>
          <ul className="mt-2 space-y-1">
            {short.map((r) => (
              <li key={r.orderId} className="break-all font-mono text-xs">
                {new Date(r.createdAt).toLocaleDateString()} · {r.email} · owed {list(r.owedByColor) || r.shortfall} of {r.quantity}
                {r.livemode ? '' : ' · TEST'}
              </li>
            ))}
          </ul>
          <button onClick={fill} disabled={busy} className="mt-3 min-h-11 w-full rounded-xl bg-amber-300 px-3 font-bold text-black disabled:opacity-60 sm:w-auto">
            {busy ? 'Assigning…' : 'Assign from online stock now'}
          </button>
        </div>
      )}
      {make.length > 0 && (
        <div role="alert" className="rounded-2xl border border-fuchsia-400/60 bg-fuchsia-400/10 p-4 text-sm">
          <p className="font-bold">To make: {toMake} logo card(s) on {make.length} order(s)</p>
          <p className="mt-1 text-white/70">
            Print the logo card, make a code above and write it to the card, then type that code here and tap Link. The buyer gets
            their setup link by email.
          </p>
          <ul className="mt-3 space-y-3">
            {make.map((r) => (
              <li key={r.orderId} className="rounded-xl bg-black/20 p-3">
                <p className="break-all font-mono text-xs">
                  {new Date(r.createdAt).toLocaleDateString()} · {r.email} · make {list(r.toMakeByColor) || r.toMake}
                  {r.livemode ? '' : ' · TEST'}
                </p>
                <div className="mt-2 flex gap-2">
                  <input
                    value={codes[r.orderId] || ''}
                    onChange={(e) => setCodes((c) => ({ ...c, [r.orderId]: e.target.value.toUpperCase() }))}
                    placeholder="Card code"
                    autoCapitalize="characters"
                    className="min-h-11 min-w-0 flex-1 rounded-lg bg-zinc-800 px-3 font-mono text-base"
                  />
                  <button onClick={() => link(r.orderId)} disabled={busy} className="min-h-11 rounded-lg bg-fuchsia-300 px-4 font-bold text-black disabled:opacity-60">
                    Link
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
