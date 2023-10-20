import Analytics from "@/components/Analytics";
import "./globals.css";
import { Metadata } from "next";
import localFont from "next/font/local";

const font = localFont({
  src: [
    {
      path: "../fonts/sans.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/sans-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
});
export const metadata: Metadata = {
  title: "London Tube Memory Game",
  description: "How many of the London Tube stations can you name from memory?",
  openGraph: {
    title: "London Tube Memory Game",
    description:
      "How many of the London Tube stations can you name from memory?",
    type: "website",
    locale: "en_GB",
    url: "https://london.metro-memory.com/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={font.className} lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7420123397062174"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={font.className}>{children}</body>
      <Analytics />
    </html>
  );
}
