'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import BoopLogo from '@/components/BoopLogo';

const READY_LINES = [
  'Your Boop is ready',
  'This Boop is waiting for you',
  'Fresh Boop. Make it yours.',
  'One tap away from your page',
  'Ready when you are',
  'This Boop has your name on it',
];

const SUB_LINES = [
  'Create your page and lock this {product} to you.',
  'Make your link. Own this {product}. Share instantly.',
  'Thirty seconds to your own Boop page.',
];

type Props = {
  code: string;
  productType: string;
};

function pick<T>(list: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  }
  return list[hash % list.length];
}

export default function ClaimReadyScreen({ code, productType }: Props) {
  const headline = useMemo(() => pick(READY_LINES, code), [code]);
  const subTemplate = useMemo(() => pick(SUB_LINES, code + productType), [code, productType]);
  const sub = subTemplate.replace('{product}', productType);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white px-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-10">
          <BoopLogo variant="white" className="h-12 w-auto max-w-[11rem]" priority />
        </div>

        <p className="text-[11px] tracking-[0.35em] uppercase text-emerald-400/90 mb-4">
          Unclaimed
        </p>

        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4 tracking-tight">
          {headline}
        </h1>

        <p className="text-white/55 text-sm mb-2">
          Code{' '}
          <span className="font-mono text-white tracking-wide">{code}</span>
        </p>
        <p className="text-white/45 text-sm mb-10 leading-relaxed">{sub}</p>

        <Link
          href={`/register?code=${encodeURIComponent(code)}`}
          className="inline-flex w-full items-center justify-center bg-white text-black font-bold py-4 px-8 rounded-2xl hover:bg-zinc-100 transition"
        >
          Create my page
        </Link>

        <p className="mt-7 text-sm text-white/40">
          Already have a page?{' '}
          <Link
            href={`/login?code=${encodeURIComponent(code)}`}
            className="text-white underline underline-offset-4 hover:text-emerald-300"
          >
            Sign in to claim it
          </Link>
        </p>

        <p className="mt-12 text-[11px] tracking-wide text-white/25">
          Building Opportunities One Profile at a time
        </p>
      </div>
    </div>
  );
}
