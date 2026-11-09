import Image from 'next/image';
import { mascotSrc, type MascotPose } from '@/lib/mascot';

export function Mascot({ pose, className = 'h-12 w-12' }: { pose: MascotPose; className?: string }) {
  return <Image unoptimized src={mascotSrc(pose)} alt="" aria-hidden width={256} height={400}
    className={`shrink-0 select-none object-contain ${className}`} data-mascot-pose={pose} data-mascot-style="drawn" />;
}

export function MascotHead({ className = 'h-full w-full' }: { className?: string }) {
  return <Image unoptimized src="/mascots/poses/clean/panther-drawn-head.webp" alt="" aria-hidden width={214} height={214}
    className={`select-none object-contain ${className}`} data-mascot-head data-mascot-style="drawn" />;
}
