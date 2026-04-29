import type { Metadata } from "next";
import { Crimson_Pro, DM_Serif_Display, JetBrains_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";

const crimsonPro = Crimson_Pro({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Liford",
  description: "Tu gestor personal de finanzas y fotografía",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${crimsonPro.variable} ${dmSerifDisplay.variable} ${jetbrainsMono.variable} ${bebasNeue.variable} h-full`}>
      <body className="min-h-full" style={{ backgroundColor: "#fdf6e3", color: "#1a1a1a" }}>
        {children}
      </body>
    </html>
  );
}
