"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, Check, ChevronDown, Flame, HeartHandshake, MapPin, MessagesSquare, Mic, Music, Plus, Store, Utensils } from "lucide-react";
import { aulas, diaDaAula, evento, hora, profissionalPorId, textos } from "@/config/evento";
import { inscricaoAtiva } from "@/config/inscricao";
import { LogoAnimada } from "@/components/LogoAnimada";
import { Rabisco, TituloSecao } from "@/components/Pecas";
import { chamada, irPara } from "@/lib/nav";
import { lista, useLista } from "@/lib/lista";
import { useProgresso } from "@/lib/progresso";
import { useRevelar } from "@/lib/revelar";
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
          <LogoAnimada entrada className="w-[min(72vw,34svh)] max-w-[400px]" />
          <div className="mt-[2svh] flex items-center justify-center gap-4 [animation:surge_0.9s_var(--ease-expo)_0.6s_both]">
            <CalendarDays className="size-[clamp(46px,13vw,62px)] shrink-0 text-brasa" strokeWidth={1.5} aria-hidden />
            <span aria-hidden className="h-[clamp(54px,15vw,72px)] w-px bg-brasa/60" />
            <p className="text-left">
              <span className="titulo block text-[clamp(46px,13.5vw,72px)] leading-[0.9]">27 e 28</span>
              <span className="espacado mt-1.5 block text-[clamp(13px,3.8vw,19px)]">de novembro</span>
            </p>
          </div>
          <p className="mt-[2.2svh] inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-brasa/75 bg-fundo/60 px-5 py-2.5 text-[clamp(15.5px,4.3vw,19px)] font-semibold [animation:surge_0.9s_var(--ease-expo)_0.7s_both]">
            <MapPin className="size-[1.2em] shrink-0 fill-brasa text-fundo" strokeWidth={1.8} aria-hidden />
            {evento.local.nome} · {evento.local.bairro}
          </p>
          <p className="espacado mt-[2svh] text-[clamp(13px,3.6vw,15.5px)] font-semibold text-ambar [animation:surge_0.9s_var(--ease-expo)_0.8s_both]">{evento.entrada}</p>
          <a
            href={`#${chamada.id}`}
            onClick={(e) => {
              e.preventDefault();
              irPara(chamada.id, "abertura");
            }}
            className="btn btn-brasa mt-[1.6svh] w-full max-w-[380px] !min-h-[60px] !text-[clamp(17px,4.8vw,20px)] [animation:surge_0.9s_var(--ease-expo)_0.9s_both]"
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

/* ───────────────── 2. Espaços: um baralho de fotos que a rolagem vai virando ───────────────── */

const iconesEspaco = { palco: Flame, paineis: MessagesSquare, podcast: Mic, churrasco: Store, solidaria: HeartHandshake, praca: Utensils, shows: Music } as const;

export function Espacos() {
  const cena = useRef<HTMLElement>(null);
  const [idx, setIdx] = useState(0);
  useProgresso(cena, "fixo");
  const { espacos, espacosAviso } = textos.imersivo;
  const N = espacos.length;

  /* qual carta está por cima: acompanha a mesma conta do CSS (a carta sai nos últimos 40% do seu trecho) */
  useEffect(() => {
    const el = cena.current;
    if (!el) return;
    let raf = 0;
    const medir = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
      setIdx(Math.min(N - 1, Math.floor(p * N + 0.2)));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, [N]);

  /** Leva a rolagem até a carta escolhida (toque na carta, nas setas ou nos ícones). */
  const ir = (i: number, origem: string) => {
    const el = cena.current;
    if (!el) return;
    const alvo = Math.min(N - 1, Math.max(0, i));
    const topo = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: topo + ((alvo + 0.12) / N) * (el.offsetHeight - window.innerHeight), behavior: "smooth" });
    track("espaco_abrir", { espaco: espacos[alvo].id, origem });
  };

  const atual = espacos[idx];
  const Icone = iconesEspaco[atual.id as keyof typeof iconesEspaco];
  return (
    <section id="espacos" ref={cena} style={{ height: `${100 + N * 58}svh` }} className="relative bg-white/[0.022] motion-reduce:!h-auto">
      {/* sem animação: lista simples */}
      <div className="hidden px-5 py-20 motion-reduce:block">
        <TituloSecao frase="Explore" titulo="O que te espera na praça" />
        <ul className="mx-auto mt-8 grid max-w-[1040px] grid-cols-2 gap-3 sm:grid-cols-4">
          {espacos.map((e) => (
            <li key={e.id} className="cartao overflow-hidden !p-0">
              <img src={e.img} alt="" width={720} height={900} loading="lazy" className="aspect-[4/5] w-full object-cover" />
              <p className="px-3 pt-3 text-[14.5px] font-extrabold">{e.titulo}</p>
              <p className="px-3 pt-1 pb-4 text-[13px] text-suave">{e.texto}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden pt-[70px] pb-[96px] md:pb-6 motion-reduce:hidden">
        <header className="shrink-0 px-5 text-center">
          <p className="manuscrito text-[clamp(26px,7.4vw,40px)] leading-none">Explore</p>
          <Rabisco className="mx-auto -mt-0.5 w-[110px]" />
          <h2 className="titulo mt-2 text-[clamp(21px,6vw,40px)]">O que te espera na praça</h2>
        </header>

        <div className="mx-auto flex min-h-0 w-full max-w-[980px] flex-1 flex-col items-center justify-center gap-[4.2svh] px-5 lg:flex-row lg:gap-16">
          {/* o baralho */}
          <div className="baralho relative aspect-[4/5] w-[min(66vw,calc(35svh*0.8))] shrink-0 lg:w-[min(380px,calc(62svh*0.8))]" style={{ ["--n" as string]: N }}>
            {espacos.map((e, i) => (
              <button
                key={e.id}
                type="button"
                tabIndex={i === idx ? 0 : -1}
                aria-label={i === N - 1 ? e.titulo : `${e.titulo}. Tocar para ver o próximo espaço.`}
                onClick={() => ir(i === N - 1 ? 0 : i + 1, "carta")}
                className={`carta absolute inset-0 overflow-hidden rounded-[26px] border border-[rgb(255_190_130/0.28)] bg-fundo shadow-[0_30px_60px_-24px_rgb(0_0_0/0.9)] ${i === N - 1 ? "ultima" : ""}`}
                style={{ zIndex: N - i, ["--i" as string]: i, ["--giro" as string]: `${i % 2 ? 2.4 : -2.4}deg` }}
              >
                <img src={e.img} alt="" width={720} height={900} loading={i < 2 ? "eager" : "lazy"} className="absolute inset-0 size-full object-cover" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[rgb(12_7_5/0.9)] to-transparent" />
                <span className="espacado absolute top-3 left-3 rounded-full bg-fundo/80 px-3 py-1.5 text-[10.5px] font-bold text-texto backdrop-blur-sm">
                  {i + 1} / {N}
                </span>
              </button>
            ))}
          </div>

          {/* o espaço da carta de cima */}
          <div className="w-full max-w-[440px] text-center lg:text-left">
            <div key={atual.id} aria-live="polite" className="[animation:surge_0.55s_var(--ease-expo)_both]">
              <div className="flex items-center justify-center gap-3 lg:justify-start">
                <span className="grid size-[50px] shrink-0 place-items-center rounded-full bg-brasa text-tinta shadow-[0_10px_30px_-8px_rgb(244_122_18/0.8)] lg:size-[60px]">
                  {atual.n ? <span className="titulo text-[23px] leading-none lg:text-[27px]">{atual.n}</span> : <Icone className="size-6 lg:size-7" strokeWidth={2} aria-hidden />}
                </span>
                <h3 className="titulo text-left text-[clamp(21px,6vw,34px)] leading-[1.02] text-ambar">{atual.titulo}</h3>
              </div>
              <p className="mx-auto mt-2.5 max-w-[26em] text-[clamp(14.5px,3.9vw,17.5px)] leading-[1.5] text-texto/85 lg:mx-0 lg:mt-4">{atual.texto}</p>
              {atual.acao && (
                <button type="button" onClick={() => irPara(atual.acao, "espacos")} className="mt-2 inline-flex items-center gap-1.5 text-[14.5px] font-bold text-ambar underline underline-offset-4 lg:mt-4">
                  Ver as aulas-show <ArrowRight className="size-4" strokeWidth={2.6} aria-hidden />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* atalhos: todos os espaços */}
        <div className="shrink-0 px-3">
          <ul className="mx-auto flex w-max max-w-full items-center gap-1.5 rounded-full border border-[rgb(255_190_130/0.16)] bg-fundo/70 p-1.5 backdrop-blur-sm sm:gap-2">
            {espacos.map((e, i) => {
              const I = iconesEspaco[e.id as keyof typeof iconesEspaco];
              const ativo = i === idx;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    aria-label={e.titulo}
                    aria-pressed={ativo}
                    title={e.titulo}
                    onClick={() => ir(i, "atalho")}
                    className={`grid size-[40px] place-items-center rounded-full transition-[background-color,color,transform] duration-300 sm:size-[46px] ${ativo ? "scale-105 bg-brasa text-tinta" : "text-brasa hover:bg-brasa/15"}`}
                  >
                    <I className="size-[19px] sm:size-[21px]" strokeWidth={1.9} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-center text-[11.5px] text-suave">Role ou toque na foto para ver o próximo · {espacosAviso}</p>
        </div>
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
