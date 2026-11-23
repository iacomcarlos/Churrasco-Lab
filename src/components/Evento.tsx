"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Flame, MessagesSquare, Mic, Music, Pause, Play, Store, Utensils, X } from "lucide-react";
import { textos } from "@/config/evento";
import { TituloSecao } from "@/components/Pecas";
import { useRevelar } from "@/lib/revelar";
import { track } from "@/lib/analytics";

const icones = { aulas: Flame, paineis: MessagesSquare, estandes: Store, praca: Utensils, podcast: Mic, shows: Music } as const;
const tempo = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Vídeo da edição passada: sem som, em repetição, só toca quando está na tela. */
function Video() {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = video.current;
    if (!v || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([x]) => (x.isIntersecting ? v.play().catch(() => undefined) : v.pause()), { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <div data-rev className="mx-auto w-full max-w-[320px] lg:max-w-[340px]">
      <div className="relative aspect-[9/16] overflow-hidden rounded-[28px] border border-[rgb(255_190_130/0.2)] bg-fundo shadow-[0_30px_70px_-30px_rgb(244_122_18/0.55)]">
        <video ref={video} className="absolute inset-0 size-full object-cover" poster="/sobre/edicao-passada.webp" muted loop playsInline preload="none" aria-label="Cenas da edição passada do Churrasco LAB">
          <source src="/sobre/edicao-passada.mp4" type="video/mp4" />
        </video>
        <span className="espacado absolute top-3 left-3 rounded-full bg-fundo/75 px-3 py-1.5 text-[10.5px] font-bold text-texto backdrop-blur-sm">Edição passada</span>
      </div>
    </div>
  );
}

/**
 * Áudio oficial sobre o evento, separado do vídeo.
 *
 * Começa sozinho quando a seção chega ao meio da tela e para quando o visitante vai para outra seção.
 * Ao sair, aparece um botão flutuante para quem quiser continuar ouvindo no resto do site.
 * Se o navegador bloquear o som automático, ele começa no primeiro toque dentro da seção.
 * Quem pausa na mão não é incomodado de novo: o áudio só volta se a pessoa apertar o botão.
 */
function Audio() {
  const caixa = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [tocando, setTocando] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(43);
  const [fora, setFora] = useState(false);
  const [dispensado, setDispensado] = useState(false);
  /* estado que os ouvintes precisam ler na hora, sem esperar o React */
  const e = useRef({ dentro: false, seguir: false, manual: false, fim: false, pendente: false });

  useEffect(() => {
    const a = audio.current;
    const sec = caixa.current?.closest("section");
    if (!a || !sec || !("IntersectionObserver" in window)) return;
    const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tentar = () => {
      const st = e.current;
      if (!st.dentro || st.manual || st.fim || document.hidden) return;
      a.play().then(
        () => (st.pendente = false),
        () => (st.pendente = true),
      );
    };
    /* "dentro" = a seção cruza a faixa central da tela */
    const io = new IntersectionObserver(
      ([x]) => {
        const st = e.current;
        st.dentro = x.isIntersecting;
        setFora(!x.isIntersecting);
        if (x.isIntersecting) {
          st.seguir = false;
          if (!calmo) tentar();
        } else if (!st.seguir) {
          st.pendente = false;
          a.pause();
        }
      },
      { rootMargin: "-35% 0px -35% 0px" },
    );
    io.observe(sec);
    const gestos = ["pointerdown", "keydown", "touchend"] as const;
    const noGesto = () => e.current.pendente && tentar();
    gestos.forEach((g) => window.addEventListener(g, noGesto, { passive: true }));
    const visibilidade = () => document.hidden && !a.paused && a.pause();
    document.addEventListener("visibilitychange", visibilidade);
    return () => {
      io.disconnect();
      gestos.forEach((g) => window.removeEventListener(g, noGesto));
      document.removeEventListener("visibilitychange", visibilidade);
    };
  }, []);

  /** Botão da seção e botão flutuante: toca ou pausa por decisão do visitante. */
  const alternar = (origem: "secao" | "flutuante") => {
    const a = audio.current;
    if (!a) return;
    const st = e.current;
    if (a.paused) {
      st.manual = false;
      st.fim = false;
      st.pendente = false;
      if (origem === "flutuante") st.seguir = true;
      a.play().catch(() => undefined);
      track("audio_sobre", { acao: origem === "flutuante" ? "continuar_fora" : "tocar" });
    } else {
      st.manual = true;
      a.pause();
    }
  };

  const comecou = pos > 0;
  const flutuante = fora && !dispensado && (tocando || comecou);
  return (
    <div ref={caixa} data-rev className="cartao mb-7 flex items-center gap-3.5 !rounded-full py-2 pr-5 pl-2 text-left">
      <button
        type="button"
        onClick={() => alternar("secao")}
        aria-pressed={tocando}
        aria-label={tocando ? "Pausar o áudio sobre o evento" : "Ouvir o áudio sobre o evento"}
        className="grid size-[52px] shrink-0 place-items-center rounded-full bg-brasa text-tinta transition-transform duration-200 active:scale-90"
      >
        {tocando ? <Pause className="size-5" strokeWidth={2.8} aria-hidden /> : <Play className="ml-0.5 size-5" strokeWidth={2.8} aria-hidden />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline justify-between gap-3 text-[14.5px] font-extrabold tracking-[-0.01em]">
          <span className="truncate">{tocando ? "Tocando agora" : comecou ? "Continuar ouvindo" : "Ouça sobre o evento"}</span>
          <span className="shrink-0 text-[12.5px] font-semibold text-suave tabular-nums">
            {tempo(pos)} / {tempo(dur)}
          </span>
        </p>
        <span aria-hidden className="mt-2 block h-[4px] overflow-hidden rounded-full bg-texto/15">
          <span className="block h-full rounded-full bg-ambar transition-[width] duration-300" style={{ width: `${Math.min(100, (pos / dur) * 100)}%` }} />
        </span>
      </div>
      <audio
        ref={audio}
        src="/sobre/narracao.m4a"
        preload="none"
        onPlay={() => {
          setTocando(true);
          setDispensado(false);
        }}
        onPause={() => setTocando(false)}
        onEnded={() => {
          e.current.fim = true;
          e.current.seguir = false;
          setPos(0);
        }}
        onTimeUpdate={(ev) => setPos(ev.currentTarget.currentTime)}
        onLoadedMetadata={(ev) => Number.isFinite(ev.currentTarget.duration) && setDur(ev.currentTarget.duration)}
      />

      {/* fora da seção: opção flutuante para continuar ouvindo durante o resto da rolagem */}
      {flutuante &&
        createPortal(
          <div className="nao-imprime fixed top-[76px] left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 rounded-full border border-brasa/60 bg-fundo/92 p-1 shadow-[0_14px_40px_-12px_rgb(0_0_0/0.9)] backdrop-blur-md">
            <button type="button" onClick={() => alternar("flutuante")} aria-pressed={tocando} className="flex min-h-[42px] items-center gap-2 rounded-full bg-brasa py-1.5 pr-4 pl-3.5 text-[13.5px] font-extrabold whitespace-nowrap text-tinta">
              {tocando ? <Pause className="size-4" strokeWidth={2.8} aria-hidden /> : <Play className="size-4" strokeWidth={2.8} aria-hidden />}
              {tocando ? "Pausar áudio" : "Continuar ouvindo"}
              <span className="font-semibold tabular-nums opacity-75">{tempo(pos)}</span>
            </button>
            <button
              type="button"
              aria-label="Fechar o áudio"
              onClick={() => {
                e.current.manual = true;
                e.current.seguir = false;
                audio.current?.pause();
                setDispensado(true);
              }}
              className="grid size-[42px] place-items-center rounded-full text-texto/80"
            >
              <X className="size-[18px]" aria-hidden />
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

/** SOBRE O EVENTO: o que é, em poucas linhas, com áudio oficial, vídeo e fotos reais da edição passada e as atrações deste ano. */
export function Evento() {
  const root = useRef<HTMLElement>(null);
  useRevelar(root);
  const s = textos.sobre;
  return (
    <section id="evento" ref={root} className="relative px-5 py-20 sm:py-24">
      <TituloSecao frase={s.frase} titulo={s.titulo} apoio={s.chamada} />

      <div className="mx-auto mt-10 grid max-w-[1040px] grid-cols-1 items-center gap-10 lg:grid-cols-[340px_1fr] lg:gap-14">
        <Video />
        <div className="mx-auto min-w-0 max-w-[560px] text-center lg:mx-0 lg:text-left">
          <Audio />
          <div className="space-y-3.5 text-[clamp(15.5px,4.1vw,17px)] leading-[1.6] text-texto/85">
            {s.paragrafos.map((p, i) => (
              <p key={i} data-rev style={{ ["--atraso" as string]: `${i * 0.06}s` }}>
                {p}
              </p>
            ))}
          </div>
          <p data-rev className="mt-6 border-brasa/60 text-[clamp(17px,4.6vw,20px)] leading-[1.35] font-extrabold tracking-[-0.01em] text-ambar lg:border-l-2 lg:pl-4">
            {s.fecho}
          </p>
        </div>
      </div>

      {/* atrações desta edição (flyer oficial) */}
      <ul className="mx-auto mt-12 grid max-w-[1040px] grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {s.atracoes.map((a, i) => {
          const Icone = icones[a.id as keyof typeof icones];
          return (
            <li key={a.id} data-rev style={{ ["--atraso" as string]: `${i * 0.05}s` }} className="cartao flex min-w-0 flex-col items-center px-3 py-5 text-center">
              {a.n ? <span className="titulo text-[clamp(34px,9vw,42px)] leading-none text-ambar">{a.n}</span> : <Icone className="size-[38px] text-brasa" strokeWidth={1.6} aria-hidden />}
              <span className="mt-3 text-[14.5px] leading-tight font-extrabold tracking-[-0.01em]">{a.titulo}</span>
              {a.texto && <span className="mt-1.5 text-[12.5px] leading-snug text-suave">{a.texto}</span>}
            </li>
          );
        })}
      </ul>

      {/* fotos da edição passada */}
      <div className="mx-auto mt-12 max-w-[1040px]">
        <p data-rev className="espacado text-center text-[12.5px] font-bold text-suave">Como foi a edição passada</p>
        <ul className="-mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          {s.fotos.map((f, i) => (
            <li key={f.src} data-rev style={{ ["--atraso" as string]: `${i * 0.05}s` }} className="w-[62vw] max-w-[260px] shrink-0 snap-center overflow-hidden rounded-[20px] border border-[rgb(255_190_130/0.14)] sm:w-auto sm:max-w-none">
              <img src={f.src} alt={f.alt} width={720} height={720} loading="lazy" className="aspect-square size-full object-cover" />
            </li>
          ))}
        </ul>
        <p data-rev className="mt-5 text-center">
          <a href={s.instagram} target="_blank" rel="noopener noreferrer" onClick={() => track("instagram", { origem: "sobre" })} className="inline-flex items-center gap-2 text-[14.5px] font-bold text-ambar underline underline-offset-4">
            <Camera className="size-[18px]" aria-hidden /> Ver mais no Instagram @churrascolab
          </a>
        </p>
      </div>
    </section>
  );
}
