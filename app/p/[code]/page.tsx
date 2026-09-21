import { redirect } from 'next/navigation';
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

  return (
    <ClaimReadyScreen
      code={cleanCode}
      productType={device.productType || 'card'}
    />
  );
}
