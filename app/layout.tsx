import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { App, ConfigProvider } from "antd";
import { UserProvider } from "@/components/UserContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_SHORTNAME || "SIPP"}`,
  description:
    "Sistem informasi Pembiayaab Pensiun By Koperasi Jasa Sena Jaya Mandiri (KOPJAS SJM)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConfigProvider
          theme={{
            token: {
              fontFamily: "var(--font-geist-mono)",
            },
          }}
        >
          <App>
            <UserProvider>{children}</UserProvider>
          </App>
        </ConfigProvider>
      </body>
    </html>
  );
}
