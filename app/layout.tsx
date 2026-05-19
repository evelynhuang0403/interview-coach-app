import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interview Coach",
  description: "Private interview question practice and review progress tracker"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
