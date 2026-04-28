import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pattern Shift by El is A',
  description: 'A relaxing tile rotation puzzle game by lucaslabs.shop',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
