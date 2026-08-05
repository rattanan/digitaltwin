import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Twin – Intelligence City Platform | NT",
  description: "ศูนย์บัญชาการเมืองอัจฉริยะจังหวัดสิงห์บุรี",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[var(--background-primary)]">{children}</body>
    </html>
  );
}
