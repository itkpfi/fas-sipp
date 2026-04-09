import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { App, ConfigProvider } from "antd";
import { UserProvider } from "@/components/UserContext";
import "./globals.css";

const defaultFont = Geist({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bodyFont = Geist({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      <body className={`${defaultFont.variable} ${bodyFont.variable} antialiased`}>
        <ConfigProvider
          theme={{
            token: {
              fontFamily: "var(--font-body)",
              colorPrimary: "#178a6d",
              colorInfo: "#178a6d",
              colorSuccess: "#16a34a",
              colorWarning: "#d97706",
              colorError: "#dc2626",
              colorText: "#0f172a",
              colorTextSecondary: "#475569",
              colorBgLayout: "#edf3f8",
              colorBgContainer: "#ffffff",
              colorBorderSecondary: "#dbe4ee",
              borderRadius: 18,
              boxShadowSecondary: "0 24px 60px rgba(15, 23, 42, 0.08)",
            },
            components: {
              Layout: {
                headerBg: "transparent",
                siderBg: "transparent",
                bodyBg: "#edf3f8",
              },
              Menu: {
                itemBg: "transparent",
                itemBorderRadius: 16,
                itemColor: "#94a3b8",
                itemHoverColor: "#f8fafc",
                itemHoverBg: "rgba(255, 255, 255, 0.08)",
                itemSelectedColor: "#f8fafc",
                itemSelectedBg: "rgba(23, 138, 109, 0.22)",
                subMenuItemBg: "transparent",
              },
              Button: {
                borderRadius: 14,
                controlHeight: 42,
              },
              Input: {
                controlHeight: 46,
              },
              Card: {
                borderRadiusLG: 24,
              },
              Table: {
                headerBg: "#f5f8fb",
                headerColor: "#334155",
                borderColor: "#dbe4ee",
                rowHoverBg: "rgba(15, 118, 110, 0.04)",
              },
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
