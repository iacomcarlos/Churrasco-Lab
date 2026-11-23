"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef } from "react";
import { ArrowRight, CalendarDays, Check, ChevronDown, Flame, MapPin, Plus } from "lucide-react";
import { aulas, diaDaAula, evento, hora, profissionalPorId, textos } from "@/config/evento";
import { inscricaoAtiva } from "@/config/inscricao";
import { LogoImpacto } from "@/components/imersivo/LogoImpacto";
import { Rabisco } from "@/components/Pecas";
import { chamada, irPara } from "@/lib/nav";
import { lista, useLista } from "@/lib/lista";
import { useProgresso } from "@/lib/progresso";
import { track } from "@/lib/analytics";

/* ───────────────── 1. Entrada: a logo se afasta e a frase do evento acende palavra por palavra ───────────────── */

export function Entrada() {
  const cena = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  useProgresso(cena, "fixo");

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const con = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || con?.saveData) return;
    const id = window.setTimeout(() => {
      v.src = window.innerWidth < 768 ? "/video/brasas-celular.mp4" : "/video/brasas.mp4";
      v.play().catch(() => undefined);
    }, 600);
    return () => window.clearTimeout(id);
  }, []);

  const palavras = textos.imersivo.manifesto.split(" ");
  return (
    <section id="inicio" ref={cena} className="group relative h-[300svh] motion-reduce:h-auto" aria-label={`${evento.nome}: ${evento.datasTexto}, ${evento.local.nome}, ${evento.local.bairro}. ${evento.entrada}.`}>
      <div className="sticky top-0 isolate flex h-[100svh] flex-col items-center justify-center overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:py-24">
        {/* brasas reais em tela cheia; escurecem conforme a frase aparece */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-cover bg-center [transform:scale(calc(1.05+var(--p,0)*0.25))]" style={{ backgroundImage: "url(/video/brasas.webp)" }}>
          <video ref={video} muted loop playsInline preload="none" tabIndex={-1} className="size-full object-cover" />
        </div>
        <div aria-hidden className="absolute inset-0 -z-10 bg-fundo [opacity:calc(0.62+var(--p,0)*0.26)]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_38%,transparent_0%,rgb(16_10_7/0.85)_78%)]" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-fundo to-transparent" />

        {/* quadro 1: a marca e o essencial */}
        <div className="flex w-full max-w-[560px] flex-col items-center px-5 text-center [opacity:calc(1-var(--p,0)*6)] [transform:scale(calc(1+var(--p,0)*1.6))] group-data-[fase=b]:pointer-events-none group-data-[fase=c]:pointer-events-none motion-reduce:![opacity:1] motion-reduce:![transform:none]">
          <h1 className="sr-only">{evento.nome}</h1>
          <LogoImpacto className="w-[min(72vw,34svh)] max-w-[400px]" />
          <div className="mt-[2svh] flex items-center justify-center gap-4 [animation:surge_0.9s_var(--ease-expo)_0.9s_both]">
            <CalendarDays className="size-[clamp(46px,13vw,62px)] shrink-0 text-brasa" strokeWidth={1.5} aria-hidden />
            <span aria-hidden className="h-[clamp(54px,15vw,72px)] w-px bg-brasa/60" />
            <p className="text-left">
              <span className="titulo block text-[clamp(46px,13.5vw,72px)] leading-[0.9]">27 e 28</span>
              <span className="espacado mt-1.5 block text-[clamp(13px,3.8vw,19px)]">de novembro</span>
            </p>
          </div>
          <p className="mt-[2.2svh] inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-brasa/75 bg-fundo/60 px-5 py-2.5 text-[clamp(15.5px,4.3vw,19px)] font-semibold [animation:surge_0.9s_var(--ease-expo)_1.05s_both]">
            <MapPin className="size-[1.2em] shrink-0 fill-brasa text-fundo" strokeWidth={1.8} aria-hidden />
            {evento.local.nome} · {evento.local.bairro}
          </p>
          <p className="espacado mt-[2svh] text-[clamp(13px,3.6vw,15.5px)] font-semibold text-ambar [animation:surge_0.9s_var(--ease-expo)_1.2s_both]">{evento.entrada}</p>
          <a
            href={`#${chamada.id}`}
            onClick={(e) => {
              e.preventDefault();
              irPara(chamada.id, "abertura");
            }}
            className="btn btn-brasa mt-[1.6svh] w-full max-w-[380px] !min-h-[60px] !text-[clamp(17px,4.8vw,20px)] [animation:surge_0.9s_var(--ease-expo)_1.35s_both]"
          >
            {chamada.texto}
            <ArrowRight className="size-[1.15em]" strokeWidth={2.8} aria-hidden />
          </a>
        </div>

        {/* quadro 2: a frase do evento, acendendo com a rolagem */}
        <p aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto max-w-[900px] -translate-y-1/2 px-6 text-center text-[clamp(30px,8.4vw,64px)] leading-[1.12] font-extrabold tracking-[-0.03em] [opacity:clamp(0,calc((var(--p,0)-0.14)*9),1)] motion-reduce:hidden">
          {palavras.map((w, i) => (
            <span key={i} className={i < 7 ? "text-texto" : "text-ambar"} style={{ opacity: `clamp(0.14, calc((var(--p, 0) - 0.2) / 0.6 * ${palavras.length + 2} - ${i}), 1)` }}>
              {w}{" "}
            </span>
          ))}
        </p>
        <p className="sr-only">{textos.imersivo.manifesto}</p>

        <p aria-hidden className="espacado absolute bottom-[max(18px,3svh)] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-[11px] font-bold whitespace-nowrap text-texto/80 [opacity:calc(1-var(--p,0)*8)] motion-reduce:hidden">
          Role para explorar
          <ChevronDown className="size-5 [animation:desce_1.8s_ease-in-out_infinite]" />
        </p>
      </div>
    </section>
  );
}

/* ───────────────── 3. Aulas-show: a rolagem vira um passeio lateral pelos profissionais ───────────────── */

export function Passeio() {
  const cena = useRef<HTMLElement>(null);
  const marcadas = useLista();
  useProgresso(cena, "fixo");
  const n = marcadas.length;

  return (
    <section id="aulas" ref={cena} style={{ height: `${100 + aulas.length * 62}svh` }} className="relative motion-reduce:!h-auto">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden pt-[72px] pb-[100px] md:pb-5 motion-reduce:static motion-reduce:h-auto motion-reduce:overflow-visible motion-reduce:py-20">
        <header className="shrink-0 px-5 text-center">
          <p className="manuscrito text-[clamp(28px,8vw,40px)] leading-none">Bora aprender</p>
          <Rabisco className="mx-auto -mt-0.5 w-[120px]" />
          <h2 className="titulo mt-2 text-[clamp(24px,7vw,40px)]">Aulas-show</h2>
        </header>

        <div className="mt-3 flex min-h-0 flex-1 items-stretch motion-reduce:overflow-x-auto">
          <ul className="flex w-max items-stretch gap-4 px-[max(20px,calc(50vw-200px))] [transform:translateX(calc(var(--p,0)*(100vw-100%)))] motion-reduce:![transform:none] sm:gap-6">
            {aulas.map((aula) => {
              const prof = profissionalPorId(aula.profissional);
              const dia = diaDaAula(aula);
              const marcada = marcadas.includes(aula.id);
              return (
                <li key={aula.id} className={`relative flex h-full min-h-[440px] w-[80vw] max-w-[400px] shrink-0 flex-col justify-end overflow-hidden rounded-[28px] border bg-fundo transition-[border-color,box-shadow] duration-300 motion-reduce:h-[560px] ${marcada ? "border-brasa shadow-[0_0_0_1px_var(--color-brasa),0_20px_50px_-20px_rgb(244_122_18/0.7)]" : "border-[rgb(255_190_130/0.18)]"}`}>
                  {prof.foto && <img src={prof.foto} alt={`Foto de ${prof.nomeCompleto || prof.nome}`} width={880} height={1100} loading="lazy" className="absolute inset-0 size-full object-cover" style={{ objectPosition: prof.foco }} />}
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-[rgb(12_7_5/0.98)] via-[rgb(12_7_5/0.82)] to-transparent" />
                  <p className="absolute top-3 left-3 rounded-full bg-fundo/80 px-3.5 py-1.5 text-[12.5px] font-bold backdrop-blur-sm">
                    {dia.semanaCurta} {dia.diaMes} <span className="text-ambar">· {hora(aula.inicio)} às {hora(aula.fim)}</span>
                  </p>
                  <div className="relative p-5">
                    {/* o nome da aula vem com etiqueta e em laranja; quem ensina vem depois, menor, com "com" */}
                    <p className="espacado inline-block rounded-full bg-brasa px-2.5 py-1 text-[10.5px] leading-none font-extrabold text-tinta">Aula-show</p>
                    <h3 className="mt-2 text-[clamp(25px,7vw,31px)] leading-[1.05] font-extrabold tracking-[-0.02em] text-ambar">{aula.tema}</h3>
                    <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 text-[15px] leading-tight font-semibold text-texto">
                      <span className="text-[13px] font-medium text-suave">com</span>
                      {prof.nome} {prof.marca && <span className="manuscrito text-[20px] !text-texto/90">{prof.marca}</span>}
                    </p>
                    {prof.bio?.[0] && <p className="mt-2.5 line-clamp-4 border-l-2 border-brasa/60 pl-3 text-[13.5px] leading-[1.5] text-texto/85">{prof.bio[0]}</p>}
                    {inscricaoAtiva && (
                      <button
                        type="button"
                        aria-pressed={marcada}
                        onClick={() => {
                          lista.alternar(aula.id);
                          track("aula_marcar", { aula: aula.id, marcada: !marcada, origem: "passeio" });
                        }}
                        className={`btn btn-sm mt-4 w-full ${marcada ? "btn-brasa" : "btn-linha"}`}
                      >
                        {marcada ? <Check className="size-4" strokeWidth={3} aria-hidden /> : <Plus className="size-4" strokeWidth={2.6} aria-hidden />}
                        {marcada ? "Aula escolhida" : "Quero esta aula"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
            {/* última parada: seguir para a inscrição */}
            {inscricaoAtiva && (
              <li className="flex h-full min-h-[440px] w-[80vw] max-w-[400px] shrink-0 flex-col items-center justify-center rounded-[28px] border border-brasa/50 bg-cartao p-6 text-center motion-reduce:h-[560px]">
                <Flame className="size-12 text-brasa" strokeWidth={1.5} aria-hidden />
                <p aria-live="polite" className="titulo mt-4 text-[clamp(24px,6.5vw,30px)]">
                  {n === 0 ? "Escolha as suas aulas" : n === 1 ? "1 aula escolhida" : `${n} aulas escolhidas`}
                </p>
                <p className="mt-2 text-[15px] text-suave">A entrada é gratuita. Garanta o seu lugar.</p>
                <button type="button" onClick={() => irPara("inscricao", "passeio")} className="btn btn-brasa mt-6 w-full">
                  {n ? "Continuar inscrição" : "Fazer inscrição"} <ArrowRight className="size-5" strokeWidth={2.8} aria-hidden />
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* onde estou no passeio */}
        <div aria-hidden className="mx-auto mt-4 h-[3px] w-[min(60vw,260px)] shrink-0 overflow-hidden rounded-full bg-texto/15 motion-reduce:hidden">
          <span className="block h-full origin-left rounded-full bg-ambar [transform:scaleX(var(--p,0))]" />
        </div>
      </div>
    </section>
  );
}
