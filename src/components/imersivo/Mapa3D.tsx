"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Beer, Camera, DoorOpen, Flame, FlameKindling, HeartHandshake, Maximize2, Mic, Move3d, Store, Utensils } from "lucide-react";
import { textos } from "@/config/evento";
import { TituloSecao } from "@/components/Pecas";
import { irPara } from "@/lib/nav";
import { useRevelar } from "@/lib/revelar";
import { track } from "@/lib/analytics";
import type { Cena } from "./cena3d";

const icones = { palco: Flame, arena: FlameKindling, churrasco: Store, solidaria: HeartHandshake, praca: Utensils, bares: Beer, podcast: Mic, insta: Camera, entrada: DoorOpen } as const;

/**
 * MAPA 3D: a tenda do evento como maquete, montada a partir da planta baixa da organização. Arrastar gira, tocar num espaço (na maquete, no marcador
 * ou nos atalhos) faz a câmera voar até ele e abre o cartão com foto e descrição.
 * O 3D só é baixado quando o mapa está chegando na tela e só anima enquanto está visível.
 * Se o aparelho não tiver 3D, aparece a lista dos espaços no lugar.
 */
export function Mapa3D() {
  const root = useRef<HTMLElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pinos = useRef<Record<string, HTMLElement | null>>({});
  const cena = useRef<Cena | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [estado, setEstado] = useState<"espera" | "pronto" | "sem3d">("espera");
  useRevelar(root);
  const { espacos, mapaAviso } = textos.imersivo;

  const escolher = (id: string | null, origem: string) => {
    setSel(id);
    cena.current?.focar(id);
    if (id) track("mapa_espaco", { espaco: id, origem });
  };
  const escolherRef = useRef(escolher);
  escolherRef.current = escolher;

  useEffect(() => {
    const el = caixa.current;
    const cv = canvas.current;
    if (!el || !cv || !("IntersectionObserver" in window)) {
      setEstado("sem3d");
      return;
    }
    let vivo = true;
    let visivel = false;
    const perto = new IntersectionObserver(
      ([x]) => {
        if (!x.isIntersecting || cena.current) return;
        perto.disconnect();
        /* os nomes escritos na maquete usam as letras do site: espera elas carregarem (no máximo 2,5 s) */
        const letras = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((ok) => window.setTimeout(ok, 2500))]);
        Promise.all([import("./cena3d"), letras])
          .then(([{ criarCena }]) => {
            if (!vivo) return;
            cena.current = criarCena({
              canvas: cv,
              caixa: el,
              pinos: pinos.current,
              aoEscolher: (id) => escolherRef.current(id, "maquete"),
              calmo: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
              fonte: window.getComputedStyle(document.body).fontFamily || "sans-serif",
            });
            cena.current.ativo(visivel && !document.hidden);
            setEstado("pronto");
          })
          .catch(() => vivo && setEstado("sem3d"));
      },
      { rootMargin: "700px 0px" },
    );
    perto.observe(el);
    const naTela = new IntersectionObserver(([x]) => {
      visivel = x.isIntersecting;
      cena.current?.ativo(visivel && !document.hidden);
    });
    naTela.observe(el);
    const aba = () => cena.current?.ativo(visivel && !document.hidden);
    document.addEventListener("visibilitychange", aba);
    return () => {
      vivo = false;
      perto.disconnect();
      naTela.disconnect();
      document.removeEventListener("visibilitychange", aba);
      cena.current?.destruir();
      cena.current = null;
    };
  }, []);

  const atual = espacos.find((e) => e.id === sel);
  const Icone = atual ? icones[atual.id as keyof typeof icones] : Move3d;

  return (
    <section id="mapa" ref={root} className="relative bg-white/[0.022] px-4 py-20 sm:px-5 sm:py-24">
      <TituloSecao frase="Explore" titulo="O que te espera no evento" apoio="A planta do evento em 3D, com o nome e o tamanho de cada espaço. Arraste para girar e toque para chegar perto." />

      {estado === "sem3d" ? (
        <ul className="mx-auto mt-10 grid max-w-[1040px] grid-cols-2 gap-3 sm:grid-cols-4">
          {espacos.map((e) => (
            <li key={e.id} className="cartao overflow-hidden !p-0">
              {e.img && <img src={e.img} alt="" width={720} height={900} loading="lazy" className="aspect-[4/5] w-full object-cover" />}
              <p className="px-3 pt-3 text-[14.5px] font-extrabold">{e.titulo}</p>
              <p className="px-3 pt-1 pb-4 text-[13px] text-suave">{e.texto}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div data-rev className="relative mx-auto mt-8 max-w-[1120px]">
          <div ref={caixa} className="relative isolate h-[min(66svh,560px)] min-h-[400px] overflow-hidden rounded-[30px] border border-[rgb(255_190_130/0.2)] bg-[radial-gradient(ellipse_at_50%_60%,#3a2112_0%,#1a0f09_55%,#100a07_100%)] shadow-[0_40px_90px_-40px_rgb(244_122_18/0.55)] lg:h-[660px]">
            <canvas ref={canvas} aria-label="Maquete 3D da tenda do evento" className={`absolute inset-0 size-full cursor-grab touch-pan-y transition-opacity duration-700 active:cursor-grabbing ${estado === "pronto" ? "opacity-100" : "opacity-0"}`} />
            {estado === "espera" && <p className="espacado absolute inset-0 grid place-items-center text-[12px] font-bold text-suave">Montando a tenda...</p>}

            {/* marcadores: a cena 3D posiciona cada um sobre o seu espaço */}
            {espacos.map((e) => {
              const I = icones[e.id as keyof typeof icones];
              const ativo = e.id === sel;
              return (
                <button
                  key={e.id}
                  type="button"
                  ref={(el) => {
                    pinos.current[e.id] = el;
                  }}
                  aria-pressed={ativo}
                  aria-label={e.titulo}
                  onClick={() => escolher(ativo ? null : e.id, "marcador")}
                  className={`group/p absolute top-0 left-0 flex flex-col items-center opacity-0 transition-opacity duration-300 will-change-transform ${estado === "pronto" ? "" : "invisible"}`}
                >
                  <span className={`mb-1 rounded-full px-2.5 py-1 text-[11px] leading-none font-extrabold whitespace-nowrap shadow-[0_6px_18px_-6px_rgb(0_0_0/0.9)] sm:text-[12.5px] ${ativo ? "bg-brasa text-tinta" : "bg-fundo/90 text-texto opacity-0 transition-opacity duration-200 group-hover/p:opacity-100 group-focus-visible/p:opacity-100 max-sm:hidden"}`}>{e.titulo}</span>
                  <span className={`relative grid size-[30px] place-items-center rounded-full border-[1.5px] transition-[background-color,color,transform] duration-300 sm:size-[40px] ${ativo ? "scale-110 border-brasa bg-brasa text-tinta" : "border-brasa bg-fundo/90 text-brasa group-hover/p:bg-brasa group-hover/p:text-tinta"}`}>
                    {!ativo && <span aria-hidden className="absolute inset-0 rounded-full border border-brasa/70 [animation:pulsa-ponto_2.4s_ease-out_infinite] motion-reduce:hidden" />}
                    <I className="size-[15px] sm:size-[20px]" strokeWidth={1.9} aria-hidden />
                  </span>
                  <span aria-hidden className={`h-3 w-px ${ativo ? "bg-brasa" : "bg-brasa/70"}`} />
                </button>
              );
            })}

            <p className={`espacado pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-fundo/75 px-3 py-1.5 text-[10.5px] font-bold text-texto backdrop-blur-sm ${sel ? "max-sm:hidden" : ""}`}>
              <Move3d className="size-3.5 text-ambar" aria-hidden /> Arraste para girar
            </p>
            {sel && (
              <button type="button" onClick={() => escolher(null, "geral")} className="espacado absolute top-3 right-3 flex min-h-[36px] items-center gap-1.5 rounded-full border border-brasa/70 bg-fundo/85 px-3.5 text-[10.5px] font-bold text-texto backdrop-blur-sm">
                <Maximize2 className="size-3.5 text-ambar" aria-hidden /> Tenda inteira
              </button>
            )}
          </div>

          {/* cartão do espaço escolhido: por cima da maquete no computador, embaixo dela no celular */}
          <div key={sel ?? "geral"} aria-live="polite" className="cartao mx-auto mt-4 w-full max-w-[460px] overflow-hidden !bg-cartao/95 !p-0 backdrop-blur-md [animation:surge_0.55s_var(--ease-expo)_both] lg:absolute lg:right-5 lg:bottom-5 lg:mt-0 lg:w-[330px]">
            {atual ? (
              <>
                {atual.img ? (
                  <div className="relative aspect-[16/9] bg-fundo">
                    <img src={atual.img} alt="" width={720} height={900} className="absolute inset-0 size-full object-cover object-[50%_30%]" />
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[rgb(30_21_16)] to-transparent" />
                    <span className="absolute bottom-2 left-4 grid size-[50px] place-items-center rounded-full bg-brasa text-tinta shadow-[0_10px_30px_-8px_rgb(244_122_18/0.8)]">
                      {atual.n ? <span className="titulo text-[23px] leading-none">{atual.n}</span> : <Icone className="size-6" strokeWidth={2} aria-hidden />}
                    </span>
                  </div>
                ) : (
                  <div className="px-4 pt-5">
                    <span className="grid size-[50px] place-items-center rounded-full bg-brasa text-tinta">
                      <Icone className="size-6" strokeWidth={2} aria-hidden />
                    </span>
                  </div>
                )}
                <div className="px-4 pt-2.5 pb-5">
                  <h3 className="titulo text-[22px] leading-[1.05] text-ambar">{atual.titulo}</h3>
                  <p className="mt-2 text-[14.5px] leading-[1.5] text-texto/85">{atual.texto}</p>
                  {atual.acao === "aulas" && (
                    <button type="button" onClick={() => irPara("aulas", "mapa")} className="btn btn-linha btn-sm mt-4 w-full">
                      Ver as aulas-show <ArrowRight className="size-4" strokeWidth={2.6} aria-hidden />
                    </button>
                  )}
                  {atual.acao === "expositores" && (
                    <a href="/expositores" className="btn btn-linha btn-sm mt-4 w-full">
                      Quero expor <ArrowRight className="size-4" strokeWidth={2.6} aria-hidden />
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3.5 px-4 py-4">
                <span className="grid size-[50px] shrink-0 place-items-center rounded-full bg-brasa text-tinta">
                  <span className="titulo text-[23px] leading-none">{espacos.length}</span>
                </span>
                <p className="text-[14.5px] leading-snug">
                  <strong className="block text-[16px] font-extrabold">Espaços para explorar</strong>
                  <span className="text-suave">Tenda de 30 × 40 m (1.200 m²). Toque em um ponto para chegar mais perto.</span>
                </p>
              </div>
            )}
          </div>

          {/* atalhos */}
          <ul className="mx-auto mt-4 flex w-max max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-[rgb(255_190_130/0.16)] bg-fundo/70 p-1.5 sm:gap-2 lg:absolute lg:bottom-5 lg:left-5 lg:mt-0 lg:backdrop-blur-sm">
            {espacos.map((e) => {
              const I = icones[e.id as keyof typeof icones];
              const ativo = e.id === sel;
              return (
                <li key={e.id}>
                  <button type="button" aria-label={e.titulo} aria-pressed={ativo} title={e.titulo} onClick={() => escolher(ativo ? null : e.id, "atalho")} className={`grid size-[34px] shrink-0 place-items-center rounded-full transition-[background-color,color,transform] duration-300 sm:size-[44px] ${ativo ? "scale-105 bg-brasa text-tinta" : "text-brasa hover:bg-brasa/15"}`}>
                    <I className="size-[19px] sm:size-[21px]" strokeWidth={1.9} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {estado !== "sem3d" && <p className="mx-auto mt-4 max-w-[520px] text-center text-[12px] leading-snug text-suave">{mapaAviso}</p>}
    </section>
  );
}
