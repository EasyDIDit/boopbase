'use client';

import { useEffect, useState } from 'react';

type Row = { orderId: string; email: string; quantity: number; shortfall: number; createdAt: string; livemode: boolean };

/** Owner notice: paid orders still owed cards because ready stock ran out at sale. */
export default function ShortfallNotice() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
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
  const owed = rows.reduce((n, r) => n + r.shortfall, 0);
  const fill = async () => {
    setBusy(true);
    const res = await fetch('/api/owner/shortfalls', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(data.error || 'Could not fill');
    const n = (data.filled || []).reduce((a: number, f: { assigned: number }) => a + f.assigned, 0);
    setMsg(n ? `Assigned ${n} card(s) from online stock and emailed the buyers their links.` : 'No online stock to assign. Move ready cards into online stock below (or mint more), then try again.');
    load();
  };
  return (
    <div role="alert" className="mb-4 rounded-2xl border border-amber-400/60 bg-amber-400/10 p-4 text-sm">
      {rows.length > 0 && (
        <>
          <p className="font-bold">Stock short: {owed} card(s) owed on {rows.length} order(s)</p>
          <ul className="mt-2 space-y-1">
            {rows.map((r) => (
              <li key={r.orderId} className="font-mono text-xs">
                {new Date(r.createdAt).toLocaleDateString()} · {r.email} · owed {r.shortfall} of {r.quantity}
                {r.livemode ? '' : ' · TEST'}
              </li>
            ))}
          </ul>
          <button onClick={fill} disabled={busy} className="mt-3 rounded-xl bg-amber-300 px-3 py-2 font-bold text-black disabled:opacity-60">
            {busy ? 'Assigning…' : 'Assign from online stock now'}
          </button>
        </>
      )}
      {msg && <p className="mt-2">{msg}</p>}
    </div>
  );
}
