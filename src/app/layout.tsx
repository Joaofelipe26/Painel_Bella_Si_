import type { Metadata, Viewport } from 'next';
import { Dancing_Script, Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--fonte-nunito',
  display: 'swap',
});

const dancing = Dancing_Script({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--fonte-dancing',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Painel Bella Si',
  description: 'Pedidos e entregas da Bella Si Cozinha Saudável',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#3F5A1E',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} ${dancing.variable}`}>
      <body>{children}</body>
    </html>
  );
}
