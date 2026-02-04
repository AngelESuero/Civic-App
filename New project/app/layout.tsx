import "./globals.css";
import type { Metadata } from "next";
import { PwaRegister } from "./components/PwaRegister";

export const metadata: Metadata = {
  title: "Newark Civic Circuit",
  description: "Community-powered civic input for Newark residents.",
  manifest: "/manifest.json",
  themeColor: "#0b0f14"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-fog">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
