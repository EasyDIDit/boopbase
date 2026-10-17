import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { boopShopUrl } from '@/lib/shopUrl';

// Read BOOP_SHOP_URL at request time so changing it doesn't need a rebuild.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'BOOP by easydidit',
  description: 'Boop. Building Opportunities One Profile at a time. Tap-to-share digital business card. No monthly fee.',
};

export default function Home() {
  const shop = boopShopUrl();
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Image src="/brand/boop-logo-white.svg" alt="BOOP" width={110} height={40} priority />
        <Link href="/login" className="text-sm text-white/70 hover:text-white">Log in</Link>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <p className="text-sm uppercase tracking-[0.2em] text-white/50">BOOP by easydidit</p>
        <h1 className="mt-4 text-4xl sm:text-6xl font-bold max-w-3xl">
          Building Opportunities One Profile at a time.
        </h1>
        <p className="mt-6 text-lg text-white/70 max-w-xl">
          Tap-to-share digital business card. No monthly fee.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <a href={shop} className="rounded-full bg-white px-8 py-3 font-semibold text-black hover:bg-white/90">
            Get a Boop
          </a>
          <Link href="/login" className="rounded-full border border-white/30 px-8 py-3 font-semibold hover:bg-white/10">
            Already have one? Log in
          </Link>
        </div>
        <p className="mt-8 text-sm text-white/50">Got a Boop? Tap it on your phone to set up your profile.</p>
      </section>

      <footer className="px-6 py-6 text-center text-xs text-white/40">BOOP by easydidit</footer>
    </main>
  );
}
