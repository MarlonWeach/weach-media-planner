import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { AppChrome } from "@/components/layout/AppChrome";

export const metadata: Metadata = {
  title: "Weach Pricing & Media Recommender",
  description: "Sistema de geração automática de planos de mídia e precificação",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AuthProvider>
          <AppChrome>{children}</AppChrome>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

