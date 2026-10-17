import type { Metadata, Viewport } from 'next';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Oussama — Ecosystem Smart Messenger',
  description: 'Messagerie instantanée intelligente, sécurisée E2EE et connectée à votre écosystème',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Oussama Messenger',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#F8FAFC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased bg-[#F8FAFC] text-slate-900 min-h-screen selection:bg-indigo-100 selection:text-indigo-700">
        {children}
      </body>
    </html>
  );
}
