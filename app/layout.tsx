import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import AuthNav from "@/components/AuthNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resonant Inscapes",
  description: "Prompt List sharing platform for music visualization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-100 text-zinc-900">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 md:px-10">
          <header className="mb-8 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white/90 px-6 py-4 shadow-sm backdrop-blur">
            <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
              Resonant Inscapes
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="rounded-full px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 hover:text-zinc-950">
                Discover
              </Link>
              <Link href="/create" className="rounded-full px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 hover:text-zinc-950">
                Create
              </Link>
              <Link href="/library" className="rounded-full px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 hover:text-zinc-950">
                Library
              </Link>
              <AuthNav />
            </nav>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
