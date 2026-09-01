import type { Metadata } from "next";
import { Caveat, Noto_Sans_JP, Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nihonini",
    template: "%s | Nihonini",
  },
  description: "Learn Japanese. Prepare for Japan. 🇯🇵",
  applicationName: "Nihonini",
  keywords: [
    "Japanese",
    "JLPT",
    "language learning",
    "N5",
    "N4",
    "N3",
    "N2",
    "N1",
    "vocabulary",
    "kanji",
    "grammar",
  ],
  authors: [{ name: "Nihonini" }],
  creator: "Nihonini",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Nihonini",
    title: "Nihonini",
    description: "Learn Japanese. Prepare for Japan. 🇯🇵",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nihonini",
    description: "Learn Japanese. Prepare for Japan. 🇯🇵",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${caveat.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
