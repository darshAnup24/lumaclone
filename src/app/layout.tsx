import { Providers } from "./providers";
import { DemoGuideModal } from "@/components/DemoGuide/DemoGuideModal";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased`}
        >
          <Providers>
            {children}
            <DemoGuideModal />
          </Providers>
      </body>
    </html>
  );
}
