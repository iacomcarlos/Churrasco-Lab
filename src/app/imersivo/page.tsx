import type { Metadata } from "next";
import { BotaoFixo, Topo } from "@/components/Abertura";
import { Evento } from "@/components/Evento";
import { Inscricao } from "@/components/Inscricao";
import { Local, Rodape } from "@/components/Local";
import { Faiscas } from "@/components/Faiscas";
import { Entrada, Espacos, Passeio } from "@/components/imersivo/Jornada";

/** Versão imersiva em teste: fica fora do Google e sem link no site principal até ser aprovada. */
export const metadata: Metadata = {
  title: "Churrasco LAB Brasília 2026 | Versão imersiva (teste)",
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
};

export default function Page() {
  return (
    <>
      <Topo />
      <Faiscas />
      <main className="relative z-[1]">
        <Entrada />
        <Evento semAtracoes />
        <Espacos />
        <Passeio />
        <Inscricao />
        <Local />
      </main>
      <Rodape />
      <BotaoFixo />
    </>
  );
}
