import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import BoopLogo from '@/components/BoopLogo';
import { confirmEmailToken } from '@/lib/emailVerification';

export const dynamic = 'force-dynamic';

/** Confirm-your-email link target. Single-use token; the page only says yes or no. */
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  let confirmed = false;
  try {
    await connectDB();
    confirmed = !!(await confirmEmailToken(token));
  } catch {
    confirmed = false;
  }
  return (
    <div className="min-h-screen bg-zinc-950 px-5 py-8 text-white">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mb-5 flex justify-center">
          <BoopLogo variant="white" className="h-10 w-auto max-w-[9rem]" />
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{confirmed ? 'Email confirmed' : 'Link not valid'}</h1>
        <p className="mt-4 text-white/60">
          {confirmed
            ? 'Thanks! Your login email is confirmed.'
            : 'This confirm link has expired or was already used. Sign in and tap “Send a new link” on your dashboard.'}
        </p>
        <Link href="/dashboard" className="mt-8 inline-block min-h-14 w-full rounded-2xl bg-white py-4 text-lg font-bold text-black">
          Go to my dashboard
        </Link>
      </div>
    </div>
  );
}
