'use client';

import { useEffect } from 'react';
import { EditorIcon } from './EditorIcons';

/** Phone-style bottom sheet: dimmed backdrop, grab bar, title and a 44px close button. */
export function BottomSheet({
  title,
  onClose,
  children,
  footer,
  tall = false,
  labelledBy,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  tall?: boolean;
  labelledBy: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <button type="button" aria-label="Close" className="absolute inset-0 cursor-default bg-black/60" onClick={onClose} />
      <div className={`relative flex w-full max-w-lg flex-col rounded-t-[26px] border-t border-zinc-700 bg-zinc-900 px-4 pt-2 ${tall ? 'h-[calc(100dvh-118px)] max-h-[860px]' : 'max-h-[88dvh]'}`}>
        <div className="mx-auto mb-2.5 h-[5px] w-10 rounded-full bg-zinc-600" aria-hidden />
        <div className="flex items-center justify-between">
          <h2 id={labelledBy} className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-white">
            <EditorIcon name="x" className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer}
      </div>
    </div>
  );
}
