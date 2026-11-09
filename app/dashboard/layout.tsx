import { Work_Sans } from 'next/font/google';

const workSans = Work_Sans({ subsets: ['latin'] });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={workSans.className}>
      {children}
    </div>
  );
}
