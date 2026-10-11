'use client';

import Link from 'next/link';
import BoopLogo from '@/components/BoopLogo';

type Props = {
  code: string;
  productType: string;
};

const STEPS = [
  {
    n: '1',
    title: 'Tap Create',
    body: 'Takes about a minute. Name, email, username, password.',
  },
  {
    n: '2',
    title: 'Stay on this phone',
    body: 'Do not close the page. Do not switch apps. Finish the form.',
  },
  {
    n: '3',
    title: 'You are done',
    body: 'This Boop locks to your page. Tap it again anytime. No app.',
  },
];

export default function ClaimReadyScreen({ code, productType }: Props) {
  const thing = productType === 'band' ? 'band' : 'card';
  const registerHref = `/register?code=${encodeURIComponent(code)}`;
  const loginHref = `/login?code=${encodeURIComponent(code)}`;

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-5 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <Link href="/login" aria-label="Boop login" className="mx-auto">
          <BoopLogo variant="white" className="h-9 w-auto max-w-[9rem]" priority />
        </Link>

        <div className="rounded-3xl border border-emerald-400/50 bg-emerald-400/15 px-5 py-5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
            Your {thing} is ready
          </p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight">
            Claim it now.
          </h1>
          <p className="mt-2 text-sm text-white/70">
            One page. One tap. Do not leave until it is yours.
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-900 px-4 py-4 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">This code</p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-[0.18em]">{code}</p>
          <p className="mt-1 text-xs text-white/45">Write nothing. Just finish the form.</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
            How this works
          </p>
          <ol className="flex flex-col gap-2">
            {STEPS.map((step) => (
              <li key={step.n} className="flex items-start gap-3 rounded-2xl bg-zinc-900 px-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-black">
                  {step.n}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block text-sm font-bold">{step.title}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-white/55">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <Link
          href={registerHref}
          className="flex min-h-14 items-center justify-center rounded-2xl bg-white text-lg font-extrabold text-black"
        >
          Create my page and claim
        </Link>

        <div className="rounded-2xl border border-white/10 px-4 py-3 text-center">
          <p className="text-sm text-white/70">Already made a page?</p>
          <Link href={loginHref} className="mt-1 inline-block text-sm font-bold underline">
            Sign in and attach this {thing}
          </Link>
        </div>

        <ul className="grid grid-cols-3 gap-2 text-center text-[11px] text-white/45">
          <li className="rounded-xl bg-zinc-900 px-2 py-2">No app</li>
          <li className="rounded-xl bg-zinc-900 px-2 py-2">No monthly fee</li>
          <li className="rounded-xl bg-zinc-900 px-2 py-2">Any phone</li>
        </ul>
      </div>
    </div>
  );
}
