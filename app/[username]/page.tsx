'use client';

import { useState, useEffect } from 'react';
import ClientPublicProfile from './ClientPublicProfile';

interface PublicProfileProps {
  params: { username: string };
}

export default function PublicProfile({ params }: PublicProfileProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/public-profile/${params.username}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [params.username]);

  // Track view once per session
  useEffect(() => {
    const trackView = async () => {
      const viewKey = `viewed_${params.username}`;
      if (sessionStorage.getItem(viewKey)) return;

      try {
        await fetch('/api/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: params.username }),
        });
        sessionStorage.setItem(viewKey, 'true');
      } catch (error) {
        console.error('Failed to track view');
      }
    };

    trackView();
  }, [params.username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        Profile not found
      </div>
    );
  }

  return (
    <ClientPublicProfile 
      user={user} 
      backgroundImages={user.backgroundImage ? [user.backgroundImage] : []} 
    />
  );
}