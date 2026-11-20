import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exportação estática: a pasta `out/` pode ser publicada em qualquer hospedagem
  // (Vercel, Netlify, Hostinger, S3...). Não há backend: a inscrição é 100% no Sympla.
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
