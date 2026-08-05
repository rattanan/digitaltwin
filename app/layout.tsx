import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Twin – Intelligent City Platform",
  description: "ศูนย์บัญชาการเมืองอัจฉริยะจังหวัดสิงห์บุรี",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#07111f]">{children}</body>
    </html>
  );
}
