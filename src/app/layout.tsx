import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VANTAK — Thermal Hunting Specialists",
  description:
    "Precision rifles and thermal hunting gear, built to be inspected. A frontend portfolio piece.",
};

// Zoom is never disabled — see MASTER.md §9.
export const viewport: Viewport = {
  themeColor: "#050506",
  colorScheme: "dark",
  // Without this every `env(safe-area-inset-*)` resolves to 0, which makes the
  // header's inset padding dead code rather than a no-op worth keeping. The
  // page is edge-to-edge black anyway, so there is nothing to letterbox.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
