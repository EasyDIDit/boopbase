import BoopLogo from '@/components/BoopLogo';

type Props = {
  title: string;
  body: string;
};

/** Shared chrome for unknown / retired device states on /p/[code]. */
export default function ClaimStatusScreen({ title, body }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white px-6">
      <div className="max-w-sm text-center">
        <div className="flex justify-center mb-10">
          <BoopLogo variant="white" className="h-10 w-auto max-w-[9rem]" />
        </div>
        <h1 className="text-3xl font-bold mb-3 tracking-tight">{title}</h1>
        <p className="text-white/55 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
