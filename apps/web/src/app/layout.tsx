import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ecosystem Smart Messenger',
  description: 'Messagerie instantanée intelligente, sécurisée E2EE et connectée à votre écosystème',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SmartMessenger',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="font-sans antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
