'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { NFC_SETTINGS_INTENT, isAndroidUA, listenForBoopCard, probeNfc, webNfcSupported } from '@/lib/webNfc';

type State = 'none' | 'link' | 'off' | 'ready' | 'on' | 'blocked' | 'nonfc' | 'unknown';

const NOTES: Partial<Record<State, string>> = {
  on: 'NFC is on. Hold your card to the back of the phone.',
  blocked: 'NFC is blocked for this site. In Chrome, tap the icon left of the web address → Permissions → NFC → Allow. Then tap the link again.',
  nonfc: "This phone can't read NFC cards. Use the buttons below to set up your card.",
  unknown: "Couldn't check NFC. Make sure NFC is on in Settings, then hold your card to the back of the phone.",
};

/**
 * Claim page, Android Chrome only.
 * - Default: a small "Card not opening when you tap it?" link. Tapping it checks NFC (scan, then stop right away).
 * - NFC off (found by that tap, or automatically when NFC permission was already given): message + button to NFC
 *   settings + manual steps. Coming back to the page with NFC on resumes listening and opens the card's link.
 * iPhone, desktop and browsers without Web NFC: renders nothing extra.
 * Wraps the claim buttons (`children`): the NFC-off message goes ABOVE them (most visible thing on the page);
 * the small link and the notes go BELOW them, so the claim button stays first.
 */
export default function NfcOffPrompt({ children }: { children?: ReactNode }) {
  const [state, setState] = useState<State>('none');
  const [settingsTried, setSettingsTried] = useState(false);
  const stateRef = useRef<State>('none');
  const stopRef = useRef<(() => void) | null>(null);
  const busyRef = useRef(false);

  const set = (s: State) => {
    stateRef.current = s;
    setState(s);
  };

  // Only after we showed the NFC-off message: try to resume listening for the card.
  const resume = useCallback(async () => {
    if (stateRef.current !== 'off' || busyRef.current) return;
    busyRef.current = true;
    try {
      stopRef.current = await listenForBoopCard((url) => window.location.assign(url));
      set('ready');
    } catch {
      /* still off (or needs a tap): keep the message up */
    } finally {
      busyRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!webNfcSupported() || !isAndroidUA(navigator.userAgent)) return;
    let cancelled = false;
    // Feature detection must run in the browser (same pattern as NfcWritePanel).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    set('link');
    probeNfc().then((r) => {
      if (!cancelled && r === 'off' && stateRef.current === 'link') set('off');
    });
    const onBack = () => {
      if (document.visibilityState === 'visible') void resume();
    };
    document.addEventListener('visibilitychange', onBack);
    window.addEventListener('focus', onBack);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onBack);
      window.removeEventListener('focus', onBack);
      stopRef.current?.();
    };
  }, [resume]);

  // Runs from a tap, so Chrome may ask for NFC permission here.
  const check = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      set(await probeNfc());
    } finally {
      busyRef.current = false;
    }
  };

  let below: ReactNode = null;
  if (state === 'link') {
    below = (
      <button type="button" onClick={() => void check()} className="mx-auto text-xs text-white/45 underline underline-offset-2">
        Card not opening when you tap it?
      </button>
    );
  } else if (state === 'ready' || NOTES[state]) {
    const good = state === 'ready' || state === 'on';
    below = (
      <p
        role="status"
        className={`rounded-2xl border px-4 py-3 text-center text-sm ${good ? 'border-emerald-400/50 bg-emerald-400/15 font-bold text-emerald-100' : 'border-white/15 bg-zinc-900 text-white/75'}`}
      >
        {state === 'ready' ? 'NFC is on. Hold your card to the back of the phone.' : NOTES[state]}
      </p>
    );
  }

  if (state !== 'off') {
    return (
      <>
        {children}
        {below}
      </>
    );
  }

  const openSettings = () => {
    // If Android doesn't open Settings, the page stays visible: show the manual steps more strongly.
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') setSettingsTried(true);
    }, 1500);
  };

  return (
    <>
    <div role="alert" className="rounded-3xl border-2 border-amber-300 bg-amber-300 px-4 py-5 text-center text-black shadow-lg shadow-amber-300/20">
      <p className="text-lg font-extrabold leading-tight">NFC is off on this phone</p>
      <p className="mt-1 text-sm font-semibold text-black/75">Turn it on so your phone can read your card.</p>
      <a
        href={NFC_SETTINGS_INTENT}
        onClick={openSettings}
        className="mt-3 flex min-h-14 items-center justify-center rounded-2xl bg-black text-lg font-extrabold text-amber-300"
      >
        Turn on NFC to scan your card
      </a>
      <p className={`mt-2 text-xs ${settingsTried ? 'font-extrabold text-black' : 'text-black/70'}`}>
        {settingsTried ? "Settings didn't open? " : ''}Swipe down from the top of the screen and tap NFC, or open Settings and
        search &quot;NFC&quot;. Then come back here.
      </p>
      <button type="button" onClick={() => void resume()} className="mt-2 text-xs font-bold text-black underline">
        I turned it on — check again
      </button>
    </div>
    {children}
    </>
  );
}
