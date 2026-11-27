import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SITE_URL, evento } from "@/config/evento";
import { classeFontes } from "./fonts";
import "./globals.css";

const description = evento.descricao;
const tituloSite = evento.titulo;

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: tituloSite,
  description,
  applicationName: evento.nome,
  keywords: ["Churrasco LAB", "Churrasco LAB Brasília", "aulas-show", "churrasco", "Ceilândia", "Praça da Bíblia", "evento gratuito"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: tituloSite,
    description,
    siteName: evento.nome,
    images: [{ url: "/og.jpg?v=dez", width: 1200, height: 630, alt: tituloSite }],
    ...(SITE_URL ? { url: SITE_URL } : {}),
  },
  twitter: { card: "summary_large_image", title: tituloSite, description, images: ["/og.jpg?v=dez"] },
  icons: {
    icon: [
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-icon.png",
  },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#100a07",
  colorScheme: "dark",
};

const GA = process.env.NEXT_PUBLIC_GA_ID;
const GTM = process.env.NEXT_PUBLIC_GTM_ID;
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={classeFontes} suppressHydrationWarning>
      <head>
        {/* marca que há JavaScript: só então as entradas ao rolar começam escondidas */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        {children}

        {GTM && (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM}');`}
          </Script>
        )}
        {GA && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA}');`}
            </Script>
          </>
        )}
        {PIXEL && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL}');fbq('track','PageView');`}
          </Script>
        )}
      </body>
    </html>
  );
}
