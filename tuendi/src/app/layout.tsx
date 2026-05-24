import type { Metadata } from "next";
import { Poppins, Outfit, DM_Sans } from "next/font/google";
import { Providers } from "@/contexts/Providers";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--poppins",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--outfit",
  subsets: ["latin"],
});

const dm_sans = DM_Sans({
  variable: "--dm_sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Baza",
  description: "Baza | Delivery App",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt" className={`${poppins.variable} ${dm_sans.variable} ${outfit.variable}`}>
      <body className={`${poppins.variable} ${dm_sans.variable} ${outfit.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}