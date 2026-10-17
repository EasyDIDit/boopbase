import { cookies } from 'next/headers';
import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import BoopLogo from '@/components/BoopLogo';
import ClaimStatusScreen from '@/components/ClaimStatusScreen';
import ClaimLinkActions from '@/components/ClaimLinkActions';
import ResendLinkButton from '@/components/ResendLinkButton';
import { findDeviceByToken, isClaimLinkExpired } from '@/lib/claimOrder';
import { SESSION_COOKIE, usernameFromSessionToken } from '@/lib/session';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ token: string }>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <div className="flex justify-center">
          <BoopLogo variant="white" className="h-9 w-auto max-w-[9rem]" priority />
        </div>
        {children}
      </div>
    </div>
  );
}

/** One card's setup link from a BOOP email. Backup to tap-to-claim; never required. */
export default async function ClaimLinkPage({ params }: Props) {
  const { token } = await params;
  await connectDB();
  const found = await findDeviceByToken(token);
  const username = usernameFromSessionToken((await cookies()).get(SESSION_COOKIE)?.value);

  if (!found) {
    return <ClaimStatusScreen title="This link doesn't work" body="Check that you opened the whole link from your BOOP email, or reply to that email. When your card arrives you can also just tap it." />;
  }
  const { device, state } = found;

  if (device.ownerUsername) {
    if (device.ownerUsername === username) {
      return (
        <Shell>
          <h1 className="text-center text-3xl font-extrabold">Card {device.code} is yours</h1>
          <Link href="/dashboard" className="flex min-h-14 items-center justify-center rounded-2xl bg-white text-lg font-extrabold text-black">Open my page</Link>
        </Shell>
      );
    }
    return <ClaimStatusScreen title="Already set up" body="This card was already set up. If that wasn't you, reply to your order email." />;
  }

  if (state === 'replaced' || isClaimLinkExpired(device.claimExpiresAt)) {
    return (
      <Shell>
        <div className="rounded-3xl bg-zinc-900 px-5 py-5 text-center">
          <h1 className="text-2xl font-extrabold">{state === 'replaced' ? 'A newer link was sent' : 'This link expired'}</h1>
          <p className="mt-2 text-sm text-white/70">
            Your card {device.code} is still saved for you. Tap it when it arrives and sign in with the email you used at checkout,
            or get a new setup link by email.
          </p>
        </div>
        <ResendLinkButton token={token} />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="rounded-3xl border border-emerald-400/50 bg-emerald-400/15 px-5 py-5 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">BOOP card {device.code}</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight">Set up this card</h1>
        <p className="mt-2 text-sm text-white/70">
          Link this card to a page now so it works the moment it arrives. Got more than one card? Each has its own link —
          use them all on your page, or forward one so that card goes to someone else&apos;s page.
        </p>
      </div>
      <ClaimLinkActions token={token} username={username} />
    </Shell>
  );
}
