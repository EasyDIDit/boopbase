'use client';

import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { EditorIcon } from './EditorIcons';
import { MascotHead } from '@/components/Mascot';
import BoopLogo from '@/components/BoopLogo';

/** Share your Boop: copy the public link, open the phone share menu, or preview. */
export function ShareSheet({
  url,
  name,
  photo,
  onClose,
  onCopied,
  onPreview,
}: {
  url: string;
  name: string;
  photo: string | null;
  onClose: () => void;
  onCopied: () => void;
  onPreview: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const display = url.replace(/^https?:\/\//, '');

  const copy = async () => {
    if (await copyText(url)) {
      setCopied(true);
      onCopied();
    }
  };

  const share = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: name || 'My Boop', url });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    await copy(); // No share menu (most desktops): copy instead.
  };

  return (
    <BottomSheet title="Share your Boop" labelledBy="share-sheet-title" onClose={onClose}>
      <div className="pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mt-3.5 flex items-center gap-3">
          <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full bg-zinc-800">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <MascotHead />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold">{name || 'Your Boop'}</p>
            <p className="text-[13px] text-zinc-400">Your public page</p>
          </div>
        </div>
        <p className="mt-3.5 break-all rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-3 text-center text-base font-semibold" data-share-url>{display}</p>
        <div className="mt-2.5 flex gap-2">
          <button type="button" onClick={copy}
            className={`flex h-[54px] flex-1 items-center justify-center gap-2 rounded-[14px] text-base font-bold ${copied ? 'bg-[#14532d] text-[#86efac]' : 'border-[1.5px] border-zinc-600 text-white'}`}>
            <EditorIcon name={copied ? 'check' : 'link'} className="h-[18px] w-[18px]" />
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" onClick={share} className="flex h-[54px] flex-[1.3] items-center justify-center gap-2 rounded-[14px] bg-[#E72679] text-[17px] font-bold text-white">
            <EditorIcon name="share" className="h-5 w-5" />
            Share…
          </button>
        </div>
        <p className="mt-1.5 text-center text-[13px] leading-snug text-zinc-400">Opens your phone&apos;s share menu — Messages, AirDrop, WhatsApp, and more.</p>
        <button type="button" onClick={onPreview} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-zinc-600 text-base font-bold">
          <EditorIcon name="eye" className="h-5 w-5" />
          Preview my page
        </button>
        <BoopFooter />
      </div>
    </BottomSheet>
  );
}

export function BoopFooter() {
  return (
    <div className="pt-4 text-center">
      <BoopLogo variant="white" className="mx-auto h-5 w-auto" />
      <p className="mt-1.5 text-xs tracking-[0.01em] text-zinc-400">Building Opportunities One Profile at a Time</p>
    </div>
  );
}

/** Clipboard with a textarea fallback for older iOS Safari. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
