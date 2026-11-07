'use client';

import { useMemo, useState } from 'react';
import { dayKey } from '@/lib/daily';

type Day = { v?: number; t?: number; s?: number; c?: number };
type LinkLike = { id: string | number; title?: string; clicks?: number; isActive?: boolean };

const PINK = '#E72679';
const SKY = '#38bdf8';
const AMBER = '#fbbf24';
const GREEN = '#34d399';

function lastDays(n: number): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(new Date(now - i * 86400000)));
  return out;
}

function Stat({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl bg-zinc-800 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-1 text-3xl font-extrabold tabular-nums" style={{ color }}>{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-zinc-400">{sub}</div> : null}
    </div>
  );
}

export default function InsightsPanel({
  views,
  links,
  daily,
  contactSaves,
  socialTaps,
}: {
  views: number;
  links: LinkLike[];
  daily: Record<string, Day>;
  contactSaves: number;
  socialTaps: number;
}) {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const linkTaps = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
  const tapRate = views > 0 ? Math.round((linkTaps / views) * 100) : 0;
  const sorted = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
  const top = sorted[0] && (sorted[0].clicks || 0) > 0 ? sorted[0] : null;
  const unused = links.filter((l) => l.isActive !== false && !(l.clicks || 0));

  const series = useMemo(
    () => lastDays(range).map((d) => ({ d, v: daily?.[d]?.v || 0, t: daily?.[d]?.t || 0 })),
    [daily, range]
  );

  const week = useMemo(() => {
    const days = lastDays(14);
    const sum = (ds: string[], k: keyof Day) => ds.reduce((n, d) => n + (daily?.[d]?.[k] || 0), 0);
    return { thisV: sum(days.slice(7), 'v'), lastV: sum(days.slice(0, 7), 'v'), thisT: sum(days.slice(7), 't'), lastT: sum(days.slice(0, 7), 't') };
  }, [daily]);

  const max = Math.max(1, ...series.map((x) => Math.max(x.v, x.t)));
  const W = 600;
  const H = 180;
  const pt = (i: number, val: number) => `${(i / Math.max(1, series.length - 1)) * W},${H - (val / max) * (H - 10)}`;
  const line = (k: 'v' | 't') => series.map((x, i) => pt(i, x[k])).join(' ');
  const hasDaily = series.some((x) => x.v || x.t);
  const delta = (a: number, b: number) => (b === 0 ? (a > 0 ? 'new' : 'no change') : `${a >= b ? '+' : ''}${Math.round(((a - b) / b) * 100)}%`);

  const parts = [
    { label: 'Link taps', value: linkTaps, color: PINK },
    { label: 'Social taps', value: socialTaps, color: SKY },
    { label: 'Contact saves', value: contactSaves, color: GREEN },
  ];
  const partTotal = parts.reduce((n, p) => n + p.value, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  const arcs = parts.reduce<{ label: string; color: string; len: number; off: number }[]>((acc, p) => {
    const off = acc.reduce((n, a) => n + a.len, 0);
    acc.push({ label: p.label, color: p.color, len: partTotal ? (p.value / partTotal) * C : 0, off });
    return acc;
  }, []);
  const maxLink = Math.max(1, ...sorted.map((l) => l.clicks || 0));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Card views" value={views} color={GREEN} />
        <Stat label="Link taps" value={linkTaps} color={PINK} />
        <Stat label="Tap rate" value={`${tapRate}%`} sub="taps per view" color={AMBER} />
        <Stat label="Contact saves" value={contactSaves} sub={`${socialTaps} social taps`} color={SKY} />
      </div>

      <div className="rounded-2xl bg-zinc-800 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold">Views and taps by day</h4>
          <div className="flex rounded-full bg-zinc-900 p-1" role="group" aria-label="Date range">
            {([7, 30, 90] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRange(r)} aria-pressed={range === r}
                className={`rounded-full px-3 py-1 text-xs font-bold ${range === r ? 'bg-[#E72679] text-white' : 'text-zinc-400 hover:text-white'}`}>
                {r} days
              </button>
            ))}
          </div>
        </div>
        {hasDaily ? (
          <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full" preserveAspectRatio="none" role="img" aria-label={`Views and taps over the last ${range} days`}>
            <polyline points={line('v')} fill="none" stroke={GREEN} strokeWidth="3" vectorEffect="non-scaling-stroke" />
            <polyline points={line('t')} fill="none" stroke={PINK} strokeWidth="3" vectorEffect="non-scaling-stroke" />
          </svg>
        ) : (
          <p className="rounded-xl bg-zinc-900 p-6 text-center text-sm text-zinc-400">Daily history starts today. Check back after people visit your page.</p>
        )}
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-300">
          <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full" style={{ background: GREEN }} />Views</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full" style={{ background: PINK }} />Link taps</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-zinc-900 p-3">
            <div className="text-xs text-zinc-400">Views this week vs last</div>
            <div className="font-bold tabular-nums">{week.thisV} vs {week.lastV} <span className="text-zinc-400">({delta(week.thisV, week.lastV)})</span></div>
          </div>
          <div className="rounded-xl bg-zinc-900 p-3">
            <div className="text-xs text-zinc-400">Taps this week vs last</div>
            <div className="font-bold tabular-nums">{week.thisT} vs {week.lastT} <span className="text-zinc-400">({delta(week.thisT, week.lastT)})</span></div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-zinc-800 p-4">
          <h4 className="mb-3 font-bold">Taps per link</h4>
          {sorted.length === 0 ? (
            <p className="text-sm text-zinc-400">Add links to see tap counts.</p>
          ) : (
            <ul className="space-y-2.5">
              {sorted.map((l) => (
                <li key={l.id}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="truncate">{l.title}</span>
                    <span className="shrink-0 font-mono text-zinc-300">{l.clicks || 0}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-900">
                    <div className="h-full rounded-full" style={{ width: `${((l.clicks || 0) / maxLink) * 100}%`, background: PINK }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-zinc-800 p-4">
          <h4 className="mb-3 font-bold">Where the action is</h4>
          {partTotal === 0 ? (
            <p className="text-sm text-zinc-400">No taps or saves yet.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-5">
              <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90" role="img" aria-label="Share of link taps, social taps and contact saves">
                <circle cx="70" cy="70" r={R} fill="none" stroke="#18181b" strokeWidth="22" />
                {arcs.map((a) => (
                  <circle key={a.label} cx="70" cy="70" r={R} fill="none" stroke={a.color} strokeWidth="22" strokeDasharray={`${a.len} ${C - a.len}`} strokeDashoffset={-a.off} />
                ))}
              </svg>
              <ul className="space-y-1.5 text-sm">
                {parts.map((p) => (
                  <li key={p.label} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                    {p.label}
                    <span className="font-mono text-zinc-300">{p.value} ({Math.round((p.value / partTotal) * 100)}%)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border-l-4 border-[#E72679] bg-zinc-800 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-[#ff7ab6]">Top link</div>
          <div className="mt-1 font-bold">{top ? `${top.title}: ${top.clicks} taps` : 'No taps yet'}</div>
        </div>
        <div className="rounded-2xl border-l-4 border-amber-300 bg-zinc-800 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-amber-300">Not tapped yet</div>
          <div className="mt-1 text-sm">{unused.length === 0 ? 'Every link has been tapped. Nice.' : unused.map((l) => l.title).join(', ')}</div>
          {unused.length > 0 ? <div className="mt-1 text-xs text-zinc-400">Try a clearer label, an image, or move it higher.</div> : null}
        </div>
      </div>
    </div>
  );
}
