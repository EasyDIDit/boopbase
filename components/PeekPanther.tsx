'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { PEEK_EXPRESSIONS, type PeekExpression } from '@/lib/mascot';

const HEIGHT = 96;

/**
 * Drawn panther gripping a card's top border. Render it as the first child of
 * a `relative` card: the paws overlap the border, the head rises above it, and
 * the optional quip bubble points at him. Pops up on first view, then tilts.
 */
export function PeekPanther({ expression, side = 'right', quip }: { expression: PeekExpression; side?: 'left' | 'right'; quip?: string }) {
  const { width, height, grip } = PEEK_EXPRESSIONS[expression];
  const w = Math.round((HEIGHT * width) / height);
  const below = Math.round(HEIGHT * grip);
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const edge = side === 'right' ? { right: 20 } : { left: 20 };
  return (
    <>
      <span ref={ref} aria-hidden data-peek-panther={expression} data-peek-side={side}
        className="pointer-events-none absolute z-20 overflow-hidden"
        style={{ ...edge, width: w, height: HEIGHT, bottom: `calc(100% - ${below}px)` }}>
        <Image unoptimized src={`/mascots/peek/panther-drawn-peek-${expression}.webp`} alt="" width={width} height={height}
          className={`peek-pop block h-full w-full select-none object-contain object-bottom ${shown ? 'is-shown' : ''}`} />
      </span>
      {quip ? (
        <span data-peek-quip aria-hidden
          className={`peek-quip pointer-events-none absolute z-20 max-w-[10.5rem] rounded-2xl border border-white/15 bg-zinc-800 px-3 py-1.5 text-xs font-bold leading-tight text-white shadow-lg shadow-black/30 ${shown ? 'is-shown' : ''}`}
          style={{ ...(side === 'right' ? { right: w + 30 } : { left: w + 30 }), bottom: `calc(100% + ${Math.round(HEIGHT * 0.42)}px)` }}>
          {quip}
          <span className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-zinc-800 ${side === 'right' ? '-right-[6px] border-r border-t' : '-left-[6px] border-b border-l'} border-white/15`} />
        </span>
      ) : null}
    </>
  );
}

/** Space reserved above a card so the rising head never overlaps content above. */
export function peekSpace(expression: PeekExpression) {
  return Math.round(HEIGHT * (1 - PEEK_EXPRESSIONS[expression].grip)) + 4;
}
