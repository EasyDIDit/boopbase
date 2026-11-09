'use client';

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import Image from 'next/image';
import { mascotSrc, mascotStyle, type MascotPose, type MascotStyle } from '@/lib/mascot';

const PreviewAllowed = createContext(false);
const Style = createContext<MascotStyle>('3d');
const Search = createContext('');
const subscribe = (onChange: () => void) => {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
};
const getSearch = () => window.location.search;
const getServerSearch = () => '';

export function MascotProvider({ previewAllowed, children }: { previewAllowed: boolean; children: ReactNode }) {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  return (
    <PreviewAllowed.Provider value={previewAllowed}>
      <Search.Provider value={search}>
        <Style.Provider value={mascotStyle(search, previewAllowed)}>{children}</Style.Provider>
      </Search.Provider>
    </PreviewAllowed.Provider>
  );
}

export function Mascot({ pose, className = 'h-12 w-12' }: { pose: MascotPose; className?: string }) {
  const style = useContext(Style);
  return <Image src={mascotSrc(style, pose)} alt="" aria-hidden width={128} height={128}
    className={`shrink-0 select-none object-contain ${className}`} data-mascot-pose={pose} data-mascot-style={style} />;
}

export function MascotStyleSwitch() {
  const allowed = useContext(PreviewAllowed);
  const search = useContext(Search);
  const style = useContext(Style);
  if (!allowed) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400" role="group" aria-label="Preview mascot style">
      <span>Preview style</span>
      {(['3d', 'drawn'] as const).map((value) => {
        const params = new URLSearchParams(search);
        params.set('mascot', value);
        return <a key={value} href={`?${params}`} aria-current={style === value ? 'true' : undefined}
          className={`rounded-full border px-3 py-1.5 font-semibold ${style === value ? 'border-[#E72679] bg-[#E72679]/15 text-white' : 'border-zinc-700 hover:text-white'}`}>
          {value === '3d' ? '3D' : 'Drawn'}
        </a>;
      })}
    </div>
  );
}
