import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AloClínica 2.0 - Telemedicina',
  description: 'Plataforma de telemedicina segura e regulamentada para o Brasil',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
