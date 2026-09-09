import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { MobileAppRuntime } from "@/components/pwa/mobile-app";

const dmSans = localFont({
  src: "./fonts/dm-sans-latin-variable.woff2",
  variable: "--font-dm-sans",
  display: "swap",
  weight: "100 1000",
  style: "normal",
  fallback: ["Segoe UI", "Arial", "sans-serif"],
});

const playfairDisplay = localFont({
  src: "./fonts/playfair-display-latin-variable.woff2",
  variable: "--font-playfair",
  display: "swap",
  weight: "400 900",
  style: "normal",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const metadata: Metadata = {
  title: "Rotary Club App",
  applicationName: "Road Town Rotary",
  appleWebApp: { capable: true, title: "Road Town Rotary", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  description: "Member portal for the club — directory, events, service, news, and chat.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0D315B" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfairDisplay.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider><MobileAppRuntime />{children}</ThemeProvider>
      </body>
    </html>
  );
}
