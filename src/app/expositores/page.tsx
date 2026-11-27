import type { Metadata } from "next";
import { evento } from "@/config/evento";
import { expositores } from "@/config/expositores";
import { Credenciamento } from "@/components/Credenciamento";

export const metadata: Metadata = {
  title: `${expositores.titulo} | ${evento.nomeCurto}`,
  description: `${expositores.chamada} ${evento.datasTexto}, ${evento.local.nome}, ${evento.local.bairro}.`,
  alternates: { canonical: "/expositores" },
};

export default function Page() {
  return <Credenciamento />;
}
