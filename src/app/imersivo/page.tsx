import type { Metadata } from "next";

/** Endereço usado nos testes da versão imersiva. Hoje mostra o mesmo site da página principal. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
};

export { default } from "../page";
