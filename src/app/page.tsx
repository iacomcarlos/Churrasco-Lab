import { SITE_URL, aulas, evento, nomeNaProgramacao, profissionalPorId } from "@/config/evento";
import { Abertura, BotaoFixo, Topo } from "@/components/Abertura";
import { Evento } from "@/components/Evento";
import { Aulas } from "@/components/Aulas";
import { Inscricao } from "@/components/Inscricao";
import { Local, Rodape } from "@/components/Local";
import { Faiscas } from "@/components/Faiscas";

/* Dados estruturados (Google): o evento e cada aula-show, só com informação oficial. */
function jsonLd() {
  const lugar = {
    "@type": "Place",
    name: evento.local.nome,
    address: { "@type": "PostalAddress", addressLocality: evento.local.bairro, addressRegion: evento.local.ufSigla, addressCountry: "BR" },
  };
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: evento.nome,
    description: evento.descricao,
    startDate: evento.inicio,
    endDate: evento.fim,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    isAccessibleForFree: true,
    inLanguage: "pt-BR",
    url: SITE_URL,
    image: `${SITE_URL}/og.png`,
    location: lugar,
    organizer: { "@type": "Organization", name: evento.realizacao.nome },
    subEvent: aulas.map((a) => ({
      "@type": "Event",
      name: `Aula-show: ${a.tema}`,
      startDate: `${a.data}T${a.inicio}:00-03:00`,
      endDate: `${a.data}T${a.fim}:00-03:00`,
      location: lugar,
      isAccessibleForFree: true,
      performer: { "@type": "Person", name: nomeNaProgramacao(profissionalPorId(a.profissional)) },
    })),
  };
}

export default function Page() {
  return (
    <>
      <a href="#aulas" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-brasa focus:px-5 focus:py-3 focus:font-bold focus:text-tinta">
        Pular para as aulas-show
      </a>
      <Topo />
      <main>
        <Abertura />
        <Evento />
        <Aulas />
        <Inscricao />
        <Local />
      </main>
      <Rodape />
      <Faiscas />
      <BotaoFixo />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />
    </>
  );
}
