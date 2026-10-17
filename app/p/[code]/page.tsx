import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, usernameFromSessionToken } from '@/lib/session';
import { claimDevice } from '@/lib/claimDevice';
import connectDB from '@/lib/mongodb';
import Device from '@/lib/models/Device';
import User from '@/lib/models/User';
import ClaimReadyScreen from '@/components/ClaimReadyScreen';
import ClaimStatusScreen from '@/components/ClaimStatusScreen';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function TapPage({ params }: Props) {
  const { code } = await params;
  const cleanCode = (code || '').toUpperCase().trim();

  await connectDB();

  const device = await Device.findOne({ code: cleanCode });

  if (!device) {
    return (
      <ClaimStatusScreen
        title="This isn't a Boop yet"
        body="That code is not in our shop. Check the slip in the box or ask the person who handed you this."
      />
    );
  }

  if (device.status === 'disabled') {
    return (
      <ClaimStatusScreen
        title="This Boop is retired"
        body="Reply to your order email and we will make it right."
      />
    );
  }

  if (device.status === 'claimed' && device.ownerUsername) {
    device.scanCount = (device.scanCount || 0) + 1;
    await device.save();
    redirect(`/${device.ownerUsername}`);
  }

  const owner = device.ownerUsername
    ? await User.findOne({ username: device.ownerUsername })
    : null;

  if (owner) {
    device.status = 'claimed';
    device.scanCount = (device.scanCount || 0) + 1;
    await device.save();
    redirect(`/${owner.username}`);
  }

  // Sold devices: the buyer who is already signed in (matching order email or redeemed setup link)
  // gets it on tap, no form. Ready devices keep the existing create/sign-in screen.
  const sessionUser = usernameFromSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (device.status === 'sold' && sessionUser) {
    const me = await User.findOne({ username: sessionUser });
    if (me) {
      const result = await claimDevice(cleanCode, { username: me.username, email: me.email });
      if (result.status === 200) redirect(`/${me.username}`);
    }
  }

  return (
    <ClaimReadyScreen
      code={cleanCode}
      productType={device.productType || 'card'}
      soldToEmail={device.status === 'sold' && !!device.orderEmail}
    />
  );
}
