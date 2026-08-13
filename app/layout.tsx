import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tomás Pastorak — AI Product Engineer / Full Stack Developer',
  description:
    'AI Product Engineer & Full Stack Developer based in Buenos Aires. I build production systems with the Claude API, React and Node.js.',
  openGraph: {
    title: 'Tomás Pastorak — AI Product Engineer / Full Stack Developer',
    description:
      'I build production systems with the Claude API, React and Node.js.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tomás Pastorak — AI Product Engineer / Full Stack Developer',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
