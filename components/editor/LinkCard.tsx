'use client';

import { forwardRef } from 'react';
import { EditorIcon } from './EditorIcons';
import { MascotHead } from '@/components/Mascot';
import { FieldTip } from '@/components/FieldTip';

export const LINK_TITLE_MAX = 75;
export const LINK_IMAGE_ACCEPT =
  'image/png,image/jpeg,image/webp,image/svg+xml,image/heic,image/heif,.png,.jpg,.jpeg,.webp,.svg,.heic,.heif';

export type EditorLink = {
  id: string;
  title: string;
  url: string;
  isActive?: boolean;
  clicks?: number;
  LNKimg?: string;
  kind?: 'link' | 'video';
  tapUrl?: string;
};

type Props = {
  link: EditorLink;
  index: number;
  count: number;
  expanded: boolean;
  lifted: boolean;
  dimmed: boolean;
  onEdit: () => void;
  onDone: () => void;
  onChange: (patch: Partial<EditorLink>) => void;
  onPhoto: (file: File | null) => void;
  onDelete: () => void;
  onGripPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onGripPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onGripPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onMove: (delta: -1 | 1) => void;
};

const oneLine = (v: string) => v.replace(/[\r\n]+/g, ' ');

/** One link in the editor: compact card (full title + URL, wraps) or expanded edit form. */
export const LinkCard = forwardRef<HTMLDivElement, Props>(function LinkCard(p, ref) {
  const { link, expanded, lifted, dimmed } = p;
  const kind = link.kind === 'video' ? 'video' : 'link';
  const hasPhoto = !!link.LNKimg;
  const titleLen = (link.title || '').length;

  const thumb = (
    <div className="relative h-[60px] w-[60px] shrink-0">
        <label className="block h-full w-full cursor-pointer" aria-label={hasPhoto ? 'Replace link photo' : 'Add a link photo'}>
          <span className="block h-full w-full overflow-hidden rounded-[14px] bg-zinc-800">
            {hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={link.LNKimg} alt="" className="h-full w-full object-cover" />
            ) : (
              <MascotHead className="h-full w-full object-contain p-1" />
            )}
          </span>
          {!hasPhoto && (
            <span className="absolute -bottom-1.5 -right-1.5 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-zinc-900 bg-[#E72679] text-white" aria-hidden>
              <EditorIcon name="cam" className="h-[13px] w-[13px]" />
            </span>
          )}
          <input type="file" accept={LINK_IMAGE_ACCEPT} className="sr-only" onChange={(e) => { const f = e.target.files?.[0] || null; e.target.value = ''; if (f) p.onPhoto(f); }} />
        </label>
      {expanded && hasPhoto && (
        <button type="button" onClick={() => p.onPhoto(null)} aria-label="Remove photo (keeps the link)" data-remove-link-photo
          className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white bg-black text-white">
            <EditorIcon name="x" className="h-3 w-3" />
          </span>
        </button>
      )}
    </div>
  );

  return (
    // Outer box = the card's slot (shows a dashed "Drop here" while its card is lifted); inner card follows the finger.
    <div
      ref={ref}
      data-link-card={link.id}
      className={`relative mb-2.5 rounded-[18px] ${lifted ? 'z-20 border-2 border-dashed border-[#E72679] bg-[#E72679]/[.08]' : ''}`}
    >
    {lifted && <span className="absolute inset-x-0 bottom-2 text-center text-[13px] font-semibold text-[#ff7ab6]" aria-hidden>Drop here</span>}
    <div
      data-link-card-body
      data-lifted={lifted || undefined}
      className={`relative flex rounded-[18px] border bg-zinc-900 transition-[opacity,box-shadow] ${
        lifted
          ? 'z-20 border-[#E72679] bg-[#222226] shadow-[0_18px_28px_rgba(0,0,0,.7)]'
          : expanded
            ? 'border-[#E72679]'
            : 'border-[#2e2e33]'
      } ${dimmed ? 'opacity-55' : ''}`}
      style={lifted ? { rotate: '-1.5deg', scale: '1.03', margin: '-2px' } : undefined}
    >
      <button
        type="button"
        aria-label={`Reorder “${link.title || 'link'}”: hold and drag, or use arrow keys (${p.index + 1} of ${p.count})`}
        onPointerDown={p.onGripPointerDown}
        onPointerMove={p.onGripPointerMove}
        onPointerUp={p.onGripPointerUp}
        onPointerCancel={p.onGripPointerUp}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') { e.preventDefault(); p.onMove(-1); }
          if (e.key === 'ArrowDown') { e.preventDefault(); p.onMove(1); }
        }}
        onContextMenu={(e) => e.preventDefault()}
        className={`flex w-10 shrink-0 cursor-grab touch-none select-none items-center justify-center border-r border-[#232327] active:cursor-grabbing [-webkit-touch-callout:none] ${
          lifted ? 'rounded-l-[18px] bg-[#E72679]/15 text-[#E72679]' : 'text-zinc-500'
        }`}
        data-drag-handle
      >
        <EditorIcon name="grip" className="h-7 w-5" />
      </button>

      <div className="min-w-0 flex-1 p-3">
        {!expanded ? (
          <div className="flex items-start gap-3">
            {thumb}
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold leading-[1.3] [overflow-wrap:anywhere]">{link.title || <span className="text-zinc-500">Untitled link</span>}</p>
              <p className="mt-[3px] break-all text-[13px] leading-[1.35] text-zinc-400">{link.url || <span className="text-zinc-500">No web address yet</span>}</p>
              <span className="mt-1.5 inline-block rounded-md bg-zinc-800 px-[7px] py-0.5 text-[11px] font-bold text-zinc-300">
                {kind === 'video' ? 'Video' : 'Link'}
              </span>
            </div>
            <button type="button" onClick={p.onEdit} aria-label={`Edit “${link.title || 'link'}”`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#232327] text-zinc-300">
              <EditorIcon name="pen" className="h-[18px] w-[18px]" />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3">
              {thumb}
              <div className="min-w-0 flex-1">
                {hasPhoto ? (
                  <>
                    <p className="text-sm font-semibold">Tap photo to replace</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-zinc-400">✕ removes the photo only — your link stays.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold">Tap to add a photo</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-zinc-400">Optional. JPG, PNG, WebP or SVG.</p>
                  </>
                )}
              </div>
            </div>

            {/* New links are always Link. Existing Video links keep their Link/Video switch. */}
            {kind === 'video' && (
            <div className="mt-3 flex gap-[3px] rounded-xl bg-[#232327] p-[3px]" role="radiogroup" aria-label="Link type">
              {(['link', 'video'] as const).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={kind === k}
                  onClick={() => p.onChange({ kind: k })}
                  className={`h-10 flex-1 rounded-[10px] text-sm font-semibold ${kind === k ? 'bg-white text-black' : 'text-zinc-400'}`}>
                  {k === 'video' ? 'Video' : 'Link'}
                </button>
              ))}
            </div>
            )}

            <label className="mb-1.5 mt-3 flex justify-between text-[13px] font-semibold text-zinc-300" htmlFor={`title-${link.id}`}>
              <span>Button title</span><span className="font-medium text-zinc-500">{titleLen}/{LINK_TITLE_MAX}</span>
            </label>
            <textarea
              id={`title-${link.id}`}
              rows={2}
              maxLength={LINK_TITLE_MAX}
              value={link.title}
              enterKeyHint="next"
              onChange={(e) => p.onChange({ title: oneLine(e.target.value).slice(0, LINK_TITLE_MAX) })}
              placeholder="Button label, e.g. My site"
              className="block min-h-12 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-3 text-base leading-[1.35] text-white outline-none [field-sizing:content] [overflow-wrap:anywhere] focus:border-[#E72679] focus:ring-[3px] focus:ring-[#E72679]/25"
            />

            <label className="mb-1.5 mt-3 block text-[13px] font-semibold text-zinc-300" htmlFor={`url-${link.id}`}>Web address</label>
            <textarea
              id={`url-${link.id}`}
              rows={2}
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              value={link.url}
              onChange={(e) => p.onChange({ url: e.target.value.replace(/\s+/g, '') })}
              placeholder="https://your-site.com"
              className="block min-h-12 w-full resize-none break-all rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-3 text-base leading-[1.35] text-white outline-none [field-sizing:content] focus:border-[#E72679] focus:ring-[3px] focus:ring-[#E72679]/25"
            />

            {kind === 'video' && (
              <div className="mt-3">
                <label className="mb-1.5 block text-[13px] font-semibold text-zinc-300" htmlFor={`tap-${link.id}`}>Tap goes to</label>
                <input id={`tap-${link.id}`} type="url" inputMode="url" autoCapitalize="none" value={link.tapUrl || ''}
                  placeholder="Leave blank to open the full video" onChange={(e) => p.onChange({ tapUrl: e.target.value })}
                  className="min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-3 text-base text-white outline-none focus:border-[#E72679] focus:ring-[3px] focus:ring-[#E72679]/25" />
                <FieldTip kind="link">Your video plays silently in the button. Tapping it opens this link.</FieldTip>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button type="button" onClick={p.onDone} className="h-12 flex-1 rounded-[14px] bg-white text-base font-bold text-black">Done</button>
              <button type="button" onClick={p.onDelete} className="flex h-12 items-center gap-2 rounded-[14px] border-[1.5px] border-[#7f1d1d] px-3.5 text-base font-bold text-[#f87171]">
                <EditorIcon name="trash" className="h-[18px] w-[18px]" />
                Delete link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
});
