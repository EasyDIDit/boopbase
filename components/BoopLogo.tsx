import { BOOP_LOGO_BLACK, BOOP_LOGO_WHITE, BOOP_LOGO_GREY } from '@/lib/brandLogos';

type Variant = 'white' | 'black' | 'grey';

type Props = {
  variant?: Variant;
  className?: string;
  priority?: boolean;
};

const SRC: Record<Variant, string> = {
  white: BOOP_LOGO_WHITE,
  black: BOOP_LOGO_BLACK,
  grey: BOOP_LOGO_GREY,
};

/** Official Boop wordmark for app chrome (claim, auth, etc.). */
export default function BoopLogo({ variant = 'white', className = 'h-10 w-auto', priority }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[variant]}
      alt="Boop"
      className={`object-contain ${className}`}
      decoding="async"
      {...(priority ? { fetchPriority: 'high' as const } : {})}
    />
  );
}
