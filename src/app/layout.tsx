import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RekberIn — Smart Contract Escrow Marketplace",
  description: "Decentralized escrow marketplace untuk transaksi aman tanpa perantara.",
  keywords: ["escrow", "smart contract", "polygon", "amoy", "marketplace", "game accounts", "web3"],
  authors: [{ name: "RekberIn" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var _curFetch = window.fetch;
                  Object.defineProperty(window, 'fetch', {
                    get: function() { return _curFetch; },
                    set: function(f) { _curFetch = f; },
                    configurable: true,
                    enumerable: true
                  });
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground min-h-screen`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
