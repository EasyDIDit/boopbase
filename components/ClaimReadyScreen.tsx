'use client';

import Link from 'next/link';
import BoopLogo from '@/components/BoopLogo';

type Props = {
  code: string;
  productType: string;
};

const steps = [
  { n: '1', title: 'Make your page', body: 'Name, email, password.' },
  { n: '2', title: 'This card locks to you', body: 'Finish the form.' },
  { n: '3', title: 'Tap it again', body: 'Your page opens. No app.' },
];

export default function ClaimReadyScreen({ code, productType }: Props) {
  const thing = productType === 'band' ? 'band' : 'card';

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-4 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-3">
        <Link href="/login" aria-label="Boop login" className="mx-auto">
          <BoopLogo variant="white" className="h-8 w-auto max-w-[8rem]" priority />
        </Link>

        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">This {thing} is unclaimed</p>
          <p className="mt-1 text-2xl font-bold leading-tight">Claim it before you leave.</p>
        </div>

        <div className="rounded-2xl bg-zinc-900 px-4 py-3 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Your code</p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-[0.16em]">{code}</p>
        </div>

        <ol className="flex flex-col gap-2">
          {steps.map((step) => (
            <li key={step.n} className="flex items-center gap-3 rounded-xl bg-zinc-900 px-3 py-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                {step.n}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{step.title}</span>
                <span className="block text-xs text-white/55">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <Link
          href={`/register?code=${encodeURIComponent(code)}`}
          className="flex min-h-12 items-center justify-center rounded-xl bg-white text-base font-bold text-black"
        >
          Create my page and claim
        </Link>

        <p className="text-center text-sm text-white/60">
          Already have a page?{' '}
          <Link href={`/login?code=${encodeURIComponent(code)}`} className="font-semibold text-white underline">
            Sign in and claim
          </Link>
        </p>

        <p className="text-center text-[11px] text-white/35">No app. No monthly fee. Any phone.</p>
      </div>
    </div>
  );
}
