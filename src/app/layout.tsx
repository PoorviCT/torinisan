import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Don’t Break the Chain — A quick pattern game',
  description: 'Spot the sequence, beat the clock, and build your longest chain.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
