import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WRC AI Sales Platform",
  description: "Admin dashboard for WRC AI Sales Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Sidebar />
        <TopNav />
        <main style={{ 
          marginLeft: 'var(--sidebar-width)', 
          marginTop: 'var(--header-height)',
          padding: '32px',
          minHeight: 'calc(100vh - var(--header-height))'
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}
