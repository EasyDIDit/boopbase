import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import ClientPublicProfile from './ClientPublicProfile';
import ViewTracker from './ViewTracker';

interface Props {
  params: Promise<{ username: string }>;
}

export default async function PublicProfile({ params }: Props) {
  const { username } = await params;

  await connectDB();

  const user = await User.findOne({ username: username.toLowerCase() })
    .select('-password')
    .lean();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        Profile not found
      </div>
    );
  }

  const backgroundImages = user.backgroundImage ? [user.backgroundImage as string] : [];

  return (
    <>
      <ViewTracker username={username} />
      <ClientPublicProfile user={user} backgroundImages={backgroundImages} />
    </>
  );
}
