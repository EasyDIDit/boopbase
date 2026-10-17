import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import BoopLogo from '@/components/BoopLogo';
import ClaimStatusScreen from '@/components/ClaimStatusScreen';
import ClaimLinkActions from '@/components/ClaimLinkActions';
import { findOrderByToken, isClaimLinkExpired } from '@/lib/claimOrder';
import Link from 'next/link';
import { SESSION_COOKIE, usernameFromSessionToken } from '@/lib/session';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ token: string }>;
}

/** Setup link from the BOOP welcome email. Backup to tap-to-claim; never required. */
export default async function ClaimLinkPage({ params }: Props) {
  const { token } = await params;
  await connectDB();
  const order = await findOrderByToken(token);
  const username = usernameFromSessionToken((await cookies()).get(SESSION_COOKIE)?.value);

  if (!order) {
    return <ClaimStatusScreen title="This link doesn't work" body="Check that you opened the whole link from your BOOP email, or reply to that email and we will send a new one." />;
  }
  if (order.claimedUsername && order.claimedUsername !== username) {
    return <ClaimStatusScreen title="Already set up" body="This setup link was already used. If that wasn't you, reply to your order email." />;
  }
  if (!order.claimedUsername && isClaimLinkExpired(order.expiresAt)) {
    return <ClaimStatusScreen title="This link expired" body="Reply to your order email and we will send a new one. When your card arrives you can also just tap it." />;
  }

  const plural = order.quantity > 1 ? `${order.quantity} BOOP cards` : 'BOOP card';
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <div className="flex justify-center">
          <BoopLogo variant="white" className="h-9 w-auto max-w-[9rem]" priority />
        </div>
        <div className="rounded-3xl border border-emerald-400/50 bg-emerald-400/15 px-5 py-5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">Thanks for your order</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight">Set up your page</h1>
          <p className="mt-2 text-sm text-white/70">
            Make your page now so your {plural} {order.quantity > 1 ? 'are' : 'is'} ready the moment {order.quantity > 1 ? 'they arrive' : 'it arrives'}.
            When it shows up, just tap it.
          </p>
        </div>
        {order.claimedUsername === username && username ? (
          <ClaimStatusScreenInline username={username} />
        ) : (
          <ClaimLinkActions token={token} username={username} />
        )}
        <p className="text-center text-xs text-white/45">Use the email from your order ({maskEmail(order.email)}) so your card links on first tap.</p>
      </div>
    </div>
  );
}

function ClaimStatusScreenInline({ username }: { username: string }) {
  return (
    <Link href="/dashboard" className="flex min-h-14 items-center justify-center rounded-2xl bg-white text-lg font-extrabold text-black">
      You&apos;re set, @{username}. Open my page
    </Link>
  );
}

function maskEmail(email: string) {
  const [u, d] = email.split('@');
  return `${u.slice(0, 2)}${'•'.repeat(Math.max(1, u.length - 2))}@${d}`;
}
