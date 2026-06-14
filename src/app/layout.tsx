import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "Akpu Town — Land of the Ancients",
  description: "The official digital platform for Akpu Town, Orumba South LGA, Anambra State, Nigeria.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Akpu Town",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Akpu Town — Land of the Ancients",
    description: "The official digital platform for Akpu Town, Orumba South LGA, Anambra State, Nigeria.",
    images: [{ url: "/akpu-icon.jpg" }],
    siteName: "Akpu Town",
  },
};

export const viewport: Viewport = {
  themeColor: "#2d6a2d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Akpu Town" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#2d6a2d" />
      </head>
      <body>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "Outfit, sans-serif",
              fontSize: 14,
              fontWeight: 600,
            },
          }}
        />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
