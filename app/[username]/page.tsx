import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import ClientPublicProfile from './ClientPublicProfile';

export default async function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
  await connectDB();

  const { username } = await params;
  const user = await User.findOne({ username: username.toLowerCase() }).lean();

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-white">Profile not found</div>;
  }

  // Get background images
  const backgroundImages = user.backgroundImage ? [user.backgroundImage] : [];

  return <ClientPublicProfile user={user} backgroundImages={backgroundImages} />;
}