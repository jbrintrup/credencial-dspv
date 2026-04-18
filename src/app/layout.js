import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Credencial Convenios DSPV",
  description: "Sistema de credencial digital para convenios del Colegio Alemán de Puerto Varas",

  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: ["/favicon.png"],
    apple: ["/favicon.png"],
  },

  openGraph: {
    title: "Credencial DSPV",
    description: "Credencial digital de convenios",
    url: "https://credencial-dspv.vercel.app/",
    siteName: "DSPV",
    images: [
      {
        url: "https://www.calhomes.cl/imagenes/LOGO_CPA.png",
        width: 512,
        height: 512,
      },
    ],
    locale: "es_CL",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}