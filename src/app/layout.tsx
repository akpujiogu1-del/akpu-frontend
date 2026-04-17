import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Akpu — Land of the Ancients",
  description:
    "Official Community Platform for Akpu Town, Orumba South LGA, Anambra State",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} bg-white text-gray-900`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}