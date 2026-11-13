import Link from 'next/link';
import BoopLogo from '@/components/BoopLogo';

/** Shared shell for Terms / Privacy. Starter drafts: they show a review banner until a lawyer signs off. */
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 px-5 py-10 text-white">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex justify-center">
          <BoopLogo variant="white" className="h-9 w-auto max-w-[8rem]" />
        </div>
        <p role="note" className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Draft for review. This page is a starting point and has not been reviewed by a lawyer yet.
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-white/50">Last updated {updated}</p>
        <div className="legal mt-8 space-y-6 text-[15px] leading-relaxed text-white/80 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_a]:underline">
          {children}
        </div>
        <p className="mt-12 text-center text-sm text-white/40">
          <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> ·{' '}
          <a href="mailto:heyeasy@easydidit.com">heyeasy@easydidit.com</a>
        </p>
      </div>
    </div>
  );
}
