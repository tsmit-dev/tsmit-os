import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import { Toaster } from "@/components/ui/toaster";
import { PermissionsProvider } from '@/context/PermissionsContext'; // Importe o provider

export const metadata: Metadata = {
  title: 'TSMIT - Sistema de Controle de OS',
  description: 'Sistema de Controle de Ordens de Serviço',
  icons: {
    icon: "/favicon.ico",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        {/* Meta tag para responsividade */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="font-body antialiased h-full">
        <AuthProvider>
          <PermissionsProvider> {/* Envolva os children com o PermissionsProvider */}
            {children}
            <Toaster />
          </PermissionsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
