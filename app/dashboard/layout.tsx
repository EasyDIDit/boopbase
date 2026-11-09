import { Work_Sans } from 'next/font/google';
import { MascotProvider } from '@/components/Mascot';
import { allowMascotPreview } from '@/lib/mascot';

const workSans = Work_Sans({ subsets: ['latin'] });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Evaluate on the server, never against an undefined server-only env var in a client bundle.
  const previewAllowed = allowMascotPreview(process.env.VERCEL_ENV, process.env.NODE_ENV);
  return (
    <div className={workSans.className}>
      <MascotProvider previewAllowed={previewAllowed}>{children}</MascotProvider>
    </div>
  );
}
