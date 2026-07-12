'use client';

import { useEffect } from 'react';
import ClientPublicProfile from './ClientPublicProfile';

interface PublicProfileProps {
  params: { username: string };
}

export default function PublicProfile({ params }: PublicProfileProps) {
  useEffect(() => {
    const trackView = async () => {
      // Only track once per browser session
      const viewKey = `viewed_${params.username}`;
      
      if (sessionStorage.getItem(viewKey)) {
        return; // Already tracked in this session
      }

      try {
        await fetch('/api/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: params.username }),
        });

        // Mark as viewed for this session
        sessionStorage.setItem(viewKey, 'true');
      } catch (error) {
        console.error('Failed to track profile view');
      }
    };

    trackView();
  }, [params.username]);

  return (
    <ClientPublicProfile username={params.username} />
  );
}