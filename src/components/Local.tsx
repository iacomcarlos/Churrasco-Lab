"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CalendarDays, MapPin, Navigation, Share2, Ticket } from "lucide-react";
import { dias, evento, links } from "@/config/evento";
import { TituloSecao } from "@/components/Pecas";
import { LogoAnimada } from "@/components/LogoAnimada";
import { useRevelar } from "@/lib/revelar";
import { compartilhar } from "@/lib/share";
import { track } from "@/lib/analytics";

/* o mapa 3D real só é baixado quando a seção está chegando na tela */
const MapaReal3D = dynamic(() => import("@/components/MapaReal3D"), { ssr: false });

/** LOCAL: onde, quando e o botão de rota. Sem número, CEP ou estacionamento inventado. */
export function Local({ mapa3d = false }: { mapa3d?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [mapa, setMapa] = useState(false);
  const [perto, setPerto] = useState(false);
  const [sem3d, setSem3d] = useState(false);
  const semSuporte = useCallback(() => setSem3d(true), []);
  useRevelar(root);
  useEffect(() => {
    const el = root.current;
    if (!mapa3d || !el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([x]) => x.isIntersecting && (setPerto(true), io.disconnect()), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [mapa3d]);
  const em3d = mapa3d && !sem3d;
  return (
    <section id="local" ref={root} className="relative bg-white/[0.022] px-5 py-20 sm:py-24">
      <TituloSecao frase="Te esperamos" titulo={evento.local.nome} apoio={`${evento.local.bairro} · ${evento.local.uf}`} />

      <ul data-rev className="mx-auto mt-8 flex max-w-[560px] flex-wrap items-center justify-center gap-2.5">
        <li className="inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-brasa/75 px-5 py-2.5 text-[15.5px] font-semibold">
          <CalendarDays className="size-5 text-brasa" strokeWidth={1.8} aria-hidden />
          {evento.datasTexto}
        </li>
        <li className="inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-brasa/75 px-5 py-2.5 text-[15.5px] font-semibold">
          <Ticket className="size-5 text-brasa" strokeWidth={1.8} aria-hidden />
          {evento.entrada}
        </li>
      </ul>
      <p data-rev className="mt-4 text-center text-[14.5px] leading-[1.6] text-suave">
        {dias.map((d) => (
          <span key={d.id} className="mx-2 inline-block whitespace-nowrap">
            <strong className="font-bold text-texto">
              {d.semana}, {d.diaMes}:
            </strong>{" "}
            {d.horario}
          </span>
        ))}
      </p>

      {/* mapa: só carrega quando a pessoa pede (página leve) */}
      <div data-rev className={`cartao relative mx-auto mt-8 overflow-hidden ${em3d ? "aspect-[4/4.6] max-w-[1040px] sm:aspect-[16/9]" : "aspect-[4/3] max-w-[720px] sm:aspect-[16/9]"}`}>
        {em3d ? (
          perto && <MapaReal3D semSuporte={semSuporte} />
        ) : mapa ? (
          <iframe title={`Mapa: ${evento.local.buscaMapa}`} src={links.mapaEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 size-full border-0" allowFullScreen />
        ) : (
          <button
            type="button"
            onClick={() => {
              setMapa(true);
              track("mapa_abrir", {});
            }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(70%_70%_at_50%_45%,rgb(196_62_12/0.28),transparent)]"
          >
            <span className="relative grid size-[68px] place-items-center rounded-full bg-brasa text-tinta" style={{ animation: "pulso 2.2s ease-out infinite" }}>
              <MapPin className="size-8" strokeWidth={2.2} aria-hidden />
            </span>
            <span className="rounded-full border-[1.5px] border-brasa/75 px-5 py-2 text-[14px] font-bold tracking-[0.12em] uppercase">Ver no mapa</span>
          </button>
        )}
      </div>

      {em3d && <p data-rev className="mx-auto mt-3 max-w-[520px] text-center text-[12px] leading-snug text-suave">Arraste para girar e inclinar. No celular, use dois dedos para mover o mapa.</p>}

      <div data-rev className="mx-auto mt-6 grid max-w-[720px] gap-2.5 sm:grid-cols-2">
        <a href={links.comoChegar} target="_blank" rel="noopener noreferrer" onClick={() => track("mapa_click", { local: "local" })} className="btn btn-brasa">
          <Navigation className="size-5" strokeWidth={2.4} aria-hidden />
          Como chegar
        </a>
        <button type="button" onClick={() => compartilhar("local")} className="btn btn-linha">
          <Share2 className="size-5" aria-hidden />
          Compartilhar
        </button>
      </div>
    </section>
  );
}

/**
 * Rodapé como a base do flyer: a carne na grelha ao fundo e a régua de marcas num cartão claro
 * (realização à esquerda, parceria à direita).
 */
export function Rodape() {
  return (
    <footer id="rodape" className="relative z-[1] isolate overflow-hidden pt-16 text-center">
      {/* carne na grelha: um recorte para celular e outro para telas largas */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-[540px] bg-cover bg-[position:58%_bottom] sm:hidden"
        style={{ backgroundImage: "url(/fotos/grelha-carne-celular.webp)", maskImage: "linear-gradient(to top, #000 62%, transparent)", WebkitMaskImage: "linear-gradient(to top, #000 62%, transparent)" }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 hidden h-[300px] bg-cover bg-[position:center_bottom] sm:block"
        style={{ backgroundImage: "url(/fotos/grelha-carne.webp)", maskImage: "linear-gradient(to top, #000 55%, transparent)", WebkitMaskImage: "linear-gradient(to top, #000 55%, transparent)" }}
      />
      <div className="mx-auto flex max-w-[900px] flex-col items-center px-5">
        <LogoAnimada className="w-[210px] sm:w-[240px]" />
        <p className="titulo mt-2 text-[clamp(24px,7vw,32px)]">
          {evento.diasNumeros} <span className="text-ambar">{evento.mesTexto}</span>
        </p>
        <p className="mt-2 text-[15.5px] font-semibold text-suave">
          {evento.local.nome} · {evento.local.bairro}
        </p>
        <p className="espacado mt-2 text-[12.5px] font-semibold text-ambar">{evento.entrada}</p>

        {/* régua de marcas oficial (enviada pela organização em 21/11/2026): a ordem foi invertida a pedido da organização em 27/11/2026: apoio, parceria e realização */}
        <div className="mt-[250px] flex w-full max-w-[640px] flex-col items-center justify-center gap-x-4 gap-y-1 rounded-[20px] bg-[#f4ece2] px-4 py-2 shadow-[0_18px_50px_-18px_rgb(0_0_0/0.8)] min-[820px]:max-w-[860px] min-[820px]:flex-row sm:mt-[110px]">
          <div className="flex shrink-0 flex-col items-center py-2">
            <p className="text-[10.5px] font-bold tracking-[0.2em] text-[#14100e] uppercase">{evento.apoio.titulo}</p>
            <img src="/brand/economia-solidaria.png" width={1007} height={363} loading="lazy" alt={`${evento.apoio.titulo}: ${evento.apoio.nome}`} className="mt-2 h-auto w-[210px] max-w-full mix-blend-multiply" />
          </div>
          <span aria-hidden className="h-px w-4/5 bg-tinta/20 min-[820px]:h-16 min-[820px]:w-px" />
          <img src="/brand/regua-parceria.png" width={690} height={226} loading="lazy" alt={`Parceria: ${evento.parceria.nome}, ${evento.parceria.governo}`} className="h-auto w-full max-w-[330px]" />
          <span aria-hidden className="h-px w-4/5 bg-tinta/20 min-[820px]:h-16 min-[820px]:w-px" />
          <img src="/brand/regua-realizacao.png" width={420} height={252} loading="lazy" alt={`Realização: ${evento.realizacao.sigla}, ${evento.realizacao.nome}`} className="h-auto w-full max-w-[210px]" />
        </div>
        <a href="/expositores" className="mt-5 text-[13.5px] font-bold text-texto underline underline-offset-4 [text-shadow:0_1px_8px_rgb(0_0_0/0.9)] hover:text-ambar">
          Credenciamento de expositores
        </a>
        <p className="pb-safe mt-3 pb-5 text-[12px] font-medium text-texto/80 [text-shadow:0_1px_8px_rgb(0_0_0/0.9)]">
          © {evento.ano} {evento.nomeCurto}
        </p>
      </div>
    </footer>
  );
}
