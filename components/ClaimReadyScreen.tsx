'use client';

import Link from 'next/link';
import BoopLogo from '@/components/BoopLogo';

type Props = {
  code: string;
  productType: string;
};

const steps = [
  { n: '1', title: 'Make your page', body: 'Name, email, and a password. That is the whole form.' },
  { n: '2', title: 'This card locks to you', body: 'Finish the form and this Boop opens your page.' },
  { n: '3', title: 'Tap it again', body: 'Your page comes up. Add links anytime. No app.' },
];

export default function ClaimReadyScreen({ code, productType }: Props) {
  const thing = productType === 'band' ? 'band' : 'card';

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-5 py-8">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="flex justify-center">
          <BoopLogo variant="white" className="h-12 w-auto max-w-[11rem]" priority />
        </div>

        <div className="rounded-3xl border border-emerald-400/40 bg-emerald-400/10 px-5 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">This {thing} is unclaimed</p>
          <p className="mt-2 text-3xl font-bold leading-tight">Claim it before you leave.</p>
          <p className="mt-2 text-sm text-white/70">Stay on this page. One form. Then it is yours.</p>
        </div>

        <div className="rounded-3xl bg-zinc-900 px-5 py-5 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Your code</p>
          <p className="mt-1 font-mono text-4xl font-bold tracking-[0.2em]">{code}</p>
          <p className="mt-2 text-sm text-white/50">Write it down if you switch apps. You need this code.</p>
        </div>

        <ol className="flex flex-col gap-3">
          {steps.map((step) => (
            <li key={step.n} className="flex gap-4 rounded-2xl bg-zinc-900 px-4 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-black">
                {step.n}
              </span>
              <span>
                <span className="block text-lg font-semibold">{step.title}</span>
                <span className="mt-1 block text-sm leading-6 text-white/60">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <Link
          href={`/register?code=${encodeURIComponent(code)}`}
          className="flex min-h-16 items-center justify-center rounded-2xl bg-white text-lg font-bold text-black"
        >
          Create my page and claim this {thing}
        </Link>

        <div className="rounded-2xl border border-white/10 px-4 py-4 text-sm leading-6 text-white/70">
          Already made a page?{' '}
          <Link href={`/login?code=${encodeURIComponent(code)}`} className="font-semibold text-white underline">
            Sign in and claim this code
          </Link>
          . Do not make a second page.
        </div>

        <ul className="grid grid-cols-3 gap-2 text-center text-xs text-white/55">
          <li className="rounded-xl bg-zinc-900 px-2 py-3">No app</li>
          <li className="rounded-xl bg-zinc-900 px-2 py-3">No monthly fee</li>
          <li className="rounded-xl bg-zinc-900 px-2 py-3">Any phone</li>
        </ul>

        <p className="text-center text-[11px] tracking-wide text-white/30">
          Building Opportunities One Profile at a time
        </p>
      </div>
    </div>
  );
}
