'use client';

import { useState } from 'react';
import { EditorIcon } from './EditorIcons';
import { BoopFooter } from './ShareSheet';
import { MascotHead } from '@/components/Mascot';
import { IMAGE_ACCEPT } from '@/lib/imageResize';
import { SOCIAL_PLATFORMS, getPlatform, type SocialPlatformId } from '@/lib/socialPlatforms';

type Props = {
  name: string;
  bio: string;
  photo: string | null;
  photoBusy: boolean;
  photoMsg?: string;
  socialsCount: number;
  linksCount: number;
  saving: boolean;
  setName: (v: string) => void;
  setBio: (v: string) => void;
  onPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddSocial: (platform: SocialPlatformId, handle: string) => boolean;
  onAddLink: (title: string, url: string) => boolean;
  onSave: () => Promise<boolean>;
  onClose: () => void;
};

const STEPS = 5;
const field =
  'min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-3 text-base text-white outline-none placeholder:text-zinc-500 focus:border-[#E72679] focus:ring-[3px] focus:ring-[#E72679]/25';

/** Short first-run: one thing per screen (name, photo, a social, a link, save). Skip any time. */
export function FirstRun(p: Props) {
  const [step, setStep] = useState(p.name.trim() ? 1 : 0);
  const [platform, setPlatform] = useState<SocialPlatformId>('instagram');
  const [handle, setHandle] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [note, setNote] = useState<string | null>(null);

  const next = () => { setNote(null); setStep((s) => Math.min(STEPS - 1, s + 1)); };
  const back = () => { setNote(null); setStep((s) => Math.max(0, s - 1)); };

  const screens = [
    {
      title: 'What should people call you?',
      sub: 'Your name shows big at the top of your Boop.',
      nextLabel: null,
      body: (
        <div className="mt-8 space-y-4 text-left">
          <label className="block"><span className="mb-1.5 block text-[13px] font-semibold text-zinc-300">Name</span>
            <input className={field} value={p.name} onChange={(e) => p.setName(e.target.value)} placeholder="e.g. Jordan Lee" autoComplete="name" enterKeyHint="next" /></label>
          <label className="block"><span className="mb-1.5 flex justify-between text-[13px] font-semibold text-zinc-300"><span>Headline / bio</span><span className="font-medium text-zinc-500">{p.bio.length}/200</span></span>
            <textarea className={`${field} resize-none`} rows={3} maxLength={200} value={p.bio} onChange={(e) => p.setBio(e.target.value.slice(0, 200))} placeholder="One line about you, e.g. Maker in the ATL" /></label>
        </div>
      ),
    },
    {
      title: 'Add your photo',
      sub: (<>It&apos;s the first thing people see<br />when they tap your Boop.</>),
      nextLabel: 'Next: your socials',
      body: (
        <>
          <div className="mt-[30px] flex justify-center">
            <label className="relative cursor-pointer" aria-label="Upload photo">
              <span className="block h-[168px] w-[168px] overflow-hidden rounded-full border-[3px] border-dashed border-zinc-600 bg-zinc-900">
                {p.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <MascotHead className="h-full w-full object-contain p-2.5" />
                )}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-[52px] w-[52px] items-center justify-center rounded-full border-[3px] border-[#09090b] bg-[#E72679] text-white" aria-hidden>
                <EditorIcon name="cam" className="h-6 w-6" />
              </span>
              <input type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={p.onPhoto} disabled={p.photoBusy} />
            </label>
          </div>
          <p className="mt-3.5 text-center text-[13px] text-zinc-400">{p.photoMsg || 'No photo yet? The Boop panther holds your spot.'}</p>
        </>
      ),
      primary: (
        <label className="flex h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-[#E72679] text-[17px] font-bold text-white">
          <EditorIcon name="cam" className="h-5 w-5" />
          {p.photoBusy ? 'Processing…' : p.photo ? 'Change photo' : 'Upload photo'}
          <input type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={p.onPhoto} disabled={p.photoBusy} />
        </label>
      ),
    },
    {
      title: 'Add a social',
      sub: 'Pick one now. You can add more later.',
      nextLabel: 'Next: your first link',
      body: (
        <div className="mt-8 space-y-3 text-left">
          <label className="block"><span className="mb-1.5 block text-[13px] font-semibold text-zinc-300">Platform</span>
            <select className={field} value={platform} onChange={(e) => setPlatform(e.target.value as SocialPlatformId)}>
              {SOCIAL_PLATFORMS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></label>
          <label className="block"><span className="mb-1.5 block text-[13px] font-semibold text-zinc-300">Your handle or link</span>
            <input className={field} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder={getPlatform(platform)?.placeholder || '@username'} autoCapitalize="none" autoCorrect="off" spellCheck={false} /></label>
          {p.socialsCount > 0 && <p className="text-sm text-emerald-300">✓ {p.socialsCount} social{p.socialsCount > 1 ? 's' : ''} added</p>}
        </div>
      ),
      primary: (
        <button type="button" className="h-[54px] w-full rounded-[14px] bg-[#E72679] text-[17px] font-bold text-white disabled:opacity-40" disabled={!handle.trim()}
          onClick={() => { if (p.onAddSocial(platform, handle)) { setHandle(''); next(); } else setNote('That handle does not look right.'); }}>
          Add social
        </button>
      ),
    },
    {
      title: 'Add your first link',
      sub: 'Your shop, booking page, music — anything with a web address.',
      nextLabel: 'Next: save',
      body: (
        <div className="mt-8 space-y-3 text-left">
          <label className="block"><span className="mb-1.5 block text-[13px] font-semibold text-zinc-300">Web address</span>
            <input className={field} type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://your-site.com" /></label>
          <label className="block"><span className="mb-1.5 flex justify-between text-[13px] font-semibold text-zinc-300"><span>Button title</span><span className="font-medium text-zinc-500">{linkTitle.length}/75</span></span>
            <input className={field} maxLength={75} value={linkTitle} onChange={(e) => setLinkTitle(e.target.value.slice(0, 75))} placeholder="Button label, e.g. My site" /></label>
          {p.linksCount > 0 && <p className="text-sm text-emerald-300">✓ {p.linksCount} link{p.linksCount > 1 ? 's' : ''} added</p>}
        </div>
      ),
      primary: (
        <button type="button" className="h-[54px] w-full rounded-[14px] bg-[#E72679] text-[17px] font-bold text-white disabled:opacity-40" disabled={!linkTitle.trim() || !linkUrl.trim()}
          onClick={() => { if (p.onAddLink(linkTitle, linkUrl)) { setLinkTitle(''); setLinkUrl(''); next(); } else setNote('That web address does not look right.'); }}>
          Add link
        </button>
      ),
    },
    {
      title: 'Save your Boop',
      sub: 'Save now and your page is live. You can change anything later.',
      nextLabel: null,
      body: (
        <div className="mt-[30px] flex justify-center">
          <span className="block h-[140px] w-[140px] overflow-hidden rounded-full bg-zinc-900">
            {p.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <MascotHead className="h-full w-full object-contain p-2.5" />
            )}
          </span>
        </div>
      ),
      primary: (
        <button type="button" disabled={p.saving} className="h-[54px] w-full rounded-[14px] bg-[#E72679] text-[17px] font-bold text-white disabled:opacity-50"
          onClick={async () => { if (await p.onSave()) p.onClose(); else setNote('Could not save yet. Check the editor for details.'); }}>
          {p.saving ? 'Saving…' : 'Save my Boop'}
        </button>
      ),
    },
  ];
  const s = screens[step];

  return (
    <div className="fixed inset-0 z-[80] flex justify-center bg-[#09090b] text-white" role="dialog" aria-modal="true" aria-labelledby="first-run-title" data-first-run>
      <div className="flex h-full w-full max-w-md flex-col">
        <div className="flex items-center gap-2 px-4 pt-[max(0.625rem,env(safe-area-inset-top))]">
          <button type="button" onClick={back} disabled={step === 0} aria-label="Back" className="flex h-11 w-11 items-center justify-center disabled:invisible">
            <EditorIcon name="back" className="h-5 w-5" />
          </button>
          <p className="flex-1 text-center text-sm font-semibold text-zinc-400">Step {step + 1} of {STEPS}</p>
          <button type="button" onClick={p.onClose} className="flex h-11 w-11 items-center justify-center text-[15px] text-zinc-400">Skip</button>
        </div>
        <div className="flex gap-1.5 px-5 pt-2" aria-hidden>
          {Array.from({ length: STEPS }, (_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-[#E72679]' : 'bg-zinc-700'}`} />
          ))}
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[18px]">
          <div className="mt-[26px] text-center">
            <h1 id="first-run-title" className="text-[28px] font-extrabold leading-[1.15]">{s.title}</h1>
            <p className="mt-2 text-base leading-snug text-zinc-400">{s.sub}</p>
          </div>
          {s.body}
          <div className="mt-auto pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-6">
            {note && <p role="status" className="mb-2 text-center text-sm text-red-400">{note}</p>}
            {s.primary ?? (
              <button type="button" onClick={next} disabled={step === 0 && !p.name.trim()} className="h-[54px] w-full rounded-[14px] bg-[#E72679] text-[17px] font-bold text-white disabled:opacity-40">
                Next: your photo
              </button>
            )}
            {s.nextLabel && (
              <button type="button" onClick={next} className="mt-1.5 h-12 w-full text-base font-bold text-zinc-300">{s.nextLabel} →</button>
            )}
            <BoopFooter />
          </div>
        </div>
      </div>
    </div>
  );
}
