import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Orbitron } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AppVersionProvider } from "@/components/providers/AppVersionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Alien Music (Beta)",
  description:
    "Aplicación web progresiva de streaming de música inspirada en Spotify",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Alien Music",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="alien-green" data-compact="false">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased`}
      >
        <AuthProvider>
          <AppVersionProvider>{children}</AppVersionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
