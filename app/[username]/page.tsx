import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import ClientPublicProfile from './ClientPublicProfile';
import ViewTracker from './ViewTracker';
import { toPublicProfile } from '@/lib/publicProfile';

interface Props {
  params: Promise<{ username: string }>;
}

export default async function PublicProfile({ params }: Props) {
  const { username } = await params;

  await connectDB();

  const doc = await User.findOne({ username: username.toLowerCase() })
    .select('-password')
    .lean();

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        Profile not found
      </div>
    );
  }

  // Only the display allowlist reaches the client component (RSC payload).
  const user = toPublicProfile(doc as Record<string, unknown>);
  const backgroundImages = user.backgroundImage ? [user.backgroundImage] : [];

  return (
    <>
      <ViewTracker username={username} />
      <ClientPublicProfile user={user} backgroundImages={backgroundImages} />
    </>
  );
}
