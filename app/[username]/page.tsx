import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import ClientPublicProfile from './ClientPublicProfile';


useEffect(() => {
  // Increment profile views
  const incrementViews = async () => {
    try {
      await fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: params.username }),
      });
    } catch (error) {
      console.error('Failed to track view');
    }
  };

  incrementViews();
}, [params.username]);

useEffect(() => {
  const trackView = async () => {
    try {
      await fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: params.username }),
      });
    } catch (error) {
      console.error('Failed to track profile view');
    }
  };

  trackView();
}, [params.username]);
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