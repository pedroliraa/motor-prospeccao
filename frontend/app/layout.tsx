import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Motor de Prospecção | Impulse B2B",
  description: "Busca, enriquecimento e scoring de leads B2B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" style={{ height: '100%' }}>
      <body style={{
        fontFamily: "'Sansation', Arial, sans-serif",
        background: '#0D0D0D',
        minHeight: '100%',
        height: '100%',
      }}>
        {children}
      </body>
    </html>
  );
}