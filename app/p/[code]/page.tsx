import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Device from '@/lib/models/Device';
import User from '@/lib/models/User';

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
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white px-6">
        <div className="max-w-sm text-center">
          <p className="text-5xl mb-4">✦</p>
          <h1 className="text-3xl font-bold mb-3">This isn't a Boop yet</h1>
          <p className="text-white/60">
            That code is not in our shop. Check the slip in the box.
          </p>
        </div>
      </div>
    );
  }

  if (device.status === 'disabled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-3xl font-bold mb-3">This Boop is retired</h1>
          <p className="text-white/60">
            Reply to your order email and we will make it right.
          </p>
        </div>
      </div>
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white px-6">
      <div className="max-w-sm text-center">
        <p className="text-xs tracking-[4px] text-white/40 mb-6">BOOP</p>
        <h1 className="text-4xl font-bold mb-4">This Boop is new</h1>
        <p className="text-white/70 mb-2">
          Code <span className="font-mono text-white">{cleanCode}</span> has not been claimed.
        </p>
        <p className="text-white/50 mb-8">
          If this is yours, make your page and lock it to this {device.productType}.
        </p>
        <a
          href={`/register?code=${cleanCode}`}
          className="inline-block bg-white text-black font-bold py-4 px-8 rounded-2xl"
        >
          Create my page
        </a>
        <p className="mt-6 text-sm text-white/40">
          Already have a page?{' '}
          <a href={`/login?code=${cleanCode}`} className="underline text-white">
            Sign in to claim it
          </a>
        </p>
      </div>
    </div>
  );
}
