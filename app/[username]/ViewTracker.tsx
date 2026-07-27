'use client';

import { useEffect } from 'react';

export default function ViewTracker({ username }: { username: string }) {
  useEffect(() => {
    const viewKey = `viewed_${username}`;
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(viewKey)) return;

    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
      .then(() => sessionStorage.setItem(viewKey, 'true'))
      .catch(() => {});
  }, [username]);

  return null;
}
