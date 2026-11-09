'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Mascot } from '@/components/Mascot';
import type { MascotPose } from '@/lib/mascot';

/**
 * Color-coded helper tip under a form field.
 * Color says what kind of info it is; the icon and label say it too,
 * so color is never the only cue.
 */
export type TipKind = 'public' | 'private' | 'link' | 'tip';

const KINDS: Record<TipKind, { label: string; box: string; badge: string; bubble: string; edge: string; icon: ReactNode }> = {
  public: {
    label: 'On your page',
    bubble: '#301b25', edge: '#e7267999',
    box: 'border-[#E72679]/60 bg-[#E72679]/10',
    badge: 'bg-[#E72679] text-white',
    icon: (
      <path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
    ),
  },
  private: {
    label: 'Private',
    bubble: '#193029', edge: '#34d39999',
    box: 'border-emerald-400/60 bg-emerald-400/10',
    badge: 'bg-emerald-300 text-black',
    icon: (
      <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-7-2a2 2 0 1 1 4 0v2h-4V7z" />
    ),
  },
  link: {
    label: 'Your link',
    bubble: '#1b2b33', edge: '#38bdf899',
    box: 'border-sky-400/60 bg-sky-400/10',
    badge: 'bg-sky-300 text-black',
    icon: (
      <path d="M10.6 13.4a1 1 0 0 0 1.4 0l4-4a3 3 0 0 0-4.2-4.2l-1.5 1.5 1.4 1.4 1.5-1.5a1 1 0 0 1 1.4 1.4l-4 4a1 1 0 0 0 0 1.4zm2.8-2.8a1 1 0 0 0-1.4 0l-4 4a3 3 0 0 0 4.2 4.2l1.5-1.5-1.4-1.4-1.5 1.5a1 1 0 0 1-1.4-1.4l4-4a1 1 0 0 0 0-1.4z" />
    ),
  },
  tip: {
    label: 'Tip',
    bubble: '#302c1c', edge: '#fcd34d99',
    box: 'border-amber-300/60 bg-amber-300/10',
    badge: 'bg-amber-300 text-black',
    icon: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />,
  },
};

export function FieldTip({ kind = 'tip', children, className = '', pose }: { kind?: TipKind; children: ReactNode; className?: string; pose?: MascotPose }) {
  const k = KINDS[kind];
  const badge = (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ${k.badge}`}>
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>{k.icon}</svg>
      {k.label}
    </span>
  );
  // Registration tips without a mascot keep their existing layout.
  if (!pose) return (
    <span className={`mt-2 flex items-start gap-2 rounded-xl border-l-4 px-3 py-2 text-[0.8rem] font-normal leading-snug text-white/85 ${k.box} ${className}`}>
      {badge}<span className="min-w-0 pt-px">{children}</span>
    </span>
  );
  const colors = { '--tip-bg': k.bubble, '--tip-edge': k.edge } as CSSProperties;
  return (
    <span data-mascot-tip className={`relative mt-5 flex min-w-0 flex-col items-start gap-2 text-[0.8rem] font-normal leading-snug text-white/85 sm:flex-row sm:gap-3 ${className}`} style={colors}>
      <span data-mascot-speaker className={`relative ml-1 block w-16 shrink-0 sm:ml-0 ${pose === '5-peeking' ? 'h-14 border-b border-white/25' : 'h-20'}`}>
        <Mascot pose={pose} className={pose === '5-peeking' ? 'absolute -top-2 left-0 h-16 w-16 object-bottom' : 'h-20 w-16'} />
      </span>
      <span data-mascot-bubble className="relative flex w-full min-w-0 flex-1 flex-wrap items-start gap-2 rounded-2xl border border-[var(--tip-edge)] bg-[var(--tip-bg)] px-3 py-3 sm:mt-3">
        <span aria-hidden className="absolute -top-1.5 left-7 h-3 w-3 rotate-45 border-l border-t border-[var(--tip-edge)] bg-[var(--tip-bg)] sm:-left-1.5 sm:top-4 sm:border-b sm:border-t-0" />
        {badge}
        <span className="min-w-0 flex-1 basis-36 break-words pt-px">{children}</span>
      </span>
    </span>
  );
}
