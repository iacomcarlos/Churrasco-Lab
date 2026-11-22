"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { Camera, Flame, MessagesSquare, Mic, Music, Pause, Play, Store, Utensils } from "lucide-react";
import { textos } from "@/config/evento";
import { TituloSecao } from "@/components/Pecas";
import { useRevelar } from "@/lib/revelar";
import { track } from "@/lib/analytics";

const icones = { aulas: Flame, paineis: MessagesSquare, estandes: Store, praca: Utensils, podcast: Mic, shows: Music } as const;
const tempo = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Vídeo da edição passada (sem som, em repetição, só toca quando está na tela) com o botão da narração oficial. */
function Video() {
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [tocando, setTocando] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(43);

  useEffect(() => {
    const v = video.current;
    if (!v || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => undefined) : v.pause()), { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const alternar = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch(() => undefined);
      video.current?.play().catch(() => undefined);
      track("narracao", { acao: "tocar" });
    } else a.pause();
  };

  return (
    <div data-rev className="mx-auto w-full max-w-[320px] lg:max-w-[340px]">
      <div className="relative aspect-[9/16] overflow-hidden rounded-[28px] border border-[rgb(255_190_130/0.2)] bg-fundo shadow-[0_30px_70px_-30px_rgb(244_122_18/0.55)]">
        <video ref={video} className="absolute inset-0 size-full object-cover" poster="/sobre/edicao-passada.webp" muted loop playsInline preload="none" aria-label="Cenas da edição passada do Churrasco LAB">
          <source src="/sobre/edicao-passada.mp4" type="video/mp4" />
        </video>
        <span className="espacado absolute top-3 left-3 rounded-full bg-fundo/75 px-3 py-1.5 text-[10.5px] font-bold text-texto backdrop-blur-sm">Edição passada</span>
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-[rgb(12_7_5/0.95)] to-transparent" />
        <div className="absolute inset-x-3 bottom-3">
          <button type="button" onClick={alternar} aria-pressed={tocando} className="btn btn-brasa btn-sm w-full">
            {tocando ? <Pause className="size-4" strokeWidth={2.8} aria-hidden /> : <Play className="size-4" strokeWidth={2.8} aria-hidden />}
            {tocando ? "Pausar narração" : pos > 0 ? "Continuar narração" : "Ouvir a narração"}
            <span className="font-semibold opacity-75">{tempo(tocando || pos > 0 ? pos : dur)}</span>
          </button>
          <span aria-hidden className="mt-2 block h-[3px] overflow-hidden rounded-full bg-texto/20">
            <span className="block h-full rounded-full bg-ambar transition-[width] duration-300" style={{ width: `${Math.min(100, (pos / dur) * 100)}%` }} />
          </span>
        </div>
      </div>
      <audio
        ref={audio}
        src="/sobre/narracao.m4a"
        preload="none"
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => setPos(0)}
        onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDur(e.currentTarget.duration)}
      />
    </div>
  );
}

/** SOBRE O EVENTO: o que é, em poucas linhas, com vídeo e fotos reais da edição passada e as atrações deste ano. */
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
