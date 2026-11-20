"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, ChevronDown, MapPin } from "lucide-react";
import { evento } from "@/config/evento";
import { LogoBranca, Rabisco } from "@/components/Pecas";
import { LogoAnimada } from "@/components/LogoAnimada";
import { Som } from "@/components/Som";
import { chamada, irPara } from "@/lib/nav";

/** Cabeçalho mínimo: marca e o botão de inscrição. Ganha fundo ao rolar. */
export function Topo() {
  const [solido, setSolido] = useState(false);
  useEffect(() => {
    const on = () => setSolido(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${solido ? "bg-fundo/90 shadow-[0_1px_0_rgb(255_190_130/0.12)] backdrop-blur-md" : ""}`}>
      <div className="mx-auto flex h-[64px] max-w-[1120px] items-center justify-between px-4 sm:px-6">
        <a
          href="#inicio"
          onClick={(e) => {
            e.preventDefault();
            irPara("inicio", "topo");
          }}
          aria-label={`${evento.nome}, início`}
          className={`transition-opacity duration-500 ${solido ? "opacity-100" : "pointer-events-none opacity-0"}`}
          tabIndex={solido ? 0 : -1}
        >
          <LogoBranca className="h-[42px] w-auto" />
        </a>
        <div className="flex items-center gap-2">
          <Som />
          <a
            href={`#${chamada.id}`}
            onClick={(e) => {
              e.preventDefault();
              irPara(chamada.id, "topo");
            }}
            className="btn btn-brasa btn-sm !min-h-[42px]"
          >
            {chamada.curto}
          </a>
        </div>
      </div>
    </header>
  );
}

/** Botão fixo do celular: aparece depois da abertura e some quando o destino já está na tela. */
export function BotaoFixo() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const r = (id: string) => document.getElementById(id)?.getBoundingClientRect();
      const inicio = r("inicio");
      const alvo = r(chamada.id);
      const rodape = r("rodape");
      const passou = !!inicio && inicio.bottom < vh * 0.4;
      const noAlvo = !!alvo && alvo.top < vh * 0.8 && alvo.bottom > vh * 0.25;
      const noFim = !!rodape && rodape.top < vh * 0.95;
      setShow(passou && !noAlvo && !noFim);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div
      className={`pb-safe pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center bg-gradient-to-t from-fundo via-fundo/85 to-transparent px-4 pt-8 transition-[transform,opacity] duration-500 ease-[var(--ease-expo)] md:hidden ${
        show ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
    >
      <a
        href={`#${chamada.id}`}
        onClick={(e) => {
          e.preventDefault();
          irPara(chamada.id, "fixo");
        }}
        tabIndex={show ? 0 : -1}
        aria-hidden={!show}
        className="btn btn-brasa pointer-events-auto w-full max-w-[420px]"
      >
        {chamada.texto}
        <ArrowRight className="size-5" strokeWidth={2.8} aria-hidden />
      </a>
    </div>
  );
}

/**
 * Abertura, diagramada como o flyer: logo, "Anota aí!", data, local e o botão.
 * No fundo, um vídeo real de brasas aparece só na base, escurecido, sem passar por trás dos textos.
 */
export function Abertura() {
  const video = useRef<HTMLVideoElement>(null);

  // o vídeo só é baixado depois que a página abriu, e nunca com "reduzir movimento" ou economia de dados
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const con = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || con?.saveData) return;
    const iniciar = () => {
      v.src = window.innerWidth < 768 ? "/video/brasas-celular.mp4" : "/video/brasas.mp4";
      v.play().catch(() => {
        /* reprodução automática bloqueada: fica a imagem parada */
      });
    };
    const id = window.setTimeout(iniciar, 600);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section id="inicio" className="relative isolate flex min-h-[100svh] flex-col items-center overflow-hidden" aria-label={`${evento.nome}: ${evento.datasTexto}, ${evento.local.nome}, ${evento.local.bairro}. ${evento.entrada}.`}>
      {/* brasas reais, só na base */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-[44%] bg-cover bg-center"
        style={{
          backgroundImage: "url(/video/brasas.webp)",
          maskImage: "linear-gradient(to top, #000 34%, transparent 98%)",
          WebkitMaskImage: "linear-gradient(to top, #000 34%, transparent 98%)",
        }}
      >
        <video ref={video} muted loop playsInline preload="none" tabIndex={-1} className="size-full object-cover" />
        <div className="absolute inset-0 bg-fundo/40" />
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-fundo to-transparent" />
      {/* luz quente atrás da logo */}
      <div aria-hidden className="absolute top-[4%] left-1/2 -z-10 size-[min(120vw,720px)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(196_62_12/0.3),transparent)]" />

      <div className="flex w-full max-w-[560px] flex-1 flex-col items-center px-5 pt-[68px] pb-[18svh] text-center">
        <h1 className="sr-only">{evento.nome}</h1>
        <LogoAnimada entrada className="w-[min(76vw,37svh)] max-w-[430px]" />

        <p className="manuscrito -mt-[1svh] text-[clamp(38px,10.5vw,56px)] [animation:surge_0.9s_var(--ease-expo)_0.5s_both]">Anota aí!</p>
        <Rabisco className="-mt-1 w-[170px] [animation:surge_0.9s_var(--ease-expo)_0.6s_both]" />

        <div className="mt-[2.4svh] flex items-center justify-center gap-4 [animation:surge_0.9s_var(--ease-expo)_0.7s_both]">
          <CalendarDays className="size-[clamp(50px,14vw,68px)] shrink-0 text-brasa" strokeWidth={1.5} aria-hidden />
          <span aria-hidden className="h-[clamp(58px,16vw,78px)] w-px bg-brasa/60" />
          <p className="text-left">
            <span className="titulo block text-[clamp(50px,14.5vw,78px)] leading-[0.9]">27 e 28</span>
            <span className="espacado mt-1.5 block text-[clamp(14px,4vw,20px)]">de novembro</span>
          </p>
        </div>

        <p className="mt-[2.4svh] inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-brasa/75 bg-fundo/60 px-5 py-2.5 text-[clamp(16px,4.5vw,20px)] font-semibold [animation:surge_0.9s_var(--ease-expo)_0.8s_both]">
          <MapPin className="size-[1.2em] shrink-0 fill-brasa text-fundo" strokeWidth={1.8} aria-hidden />
          {evento.local.nome} · {evento.local.bairro}
        </p>

        <p className="espacado mt-[2.2svh] text-[clamp(13px,3.6vw,15.5px)] font-semibold text-ambar [animation:surge_0.9s_var(--ease-expo)_0.85s_both]">{evento.entrada}</p>

        <a
          href={`#${chamada.id}`}
          onClick={(e) => {
            e.preventDefault();
            irPara(chamada.id, "abertura");
          }}
          className="btn btn-brasa mt-[1.6svh] w-full max-w-[400px] !min-h-[64px] !text-[clamp(18px,5vw,21px)] [animation:surge_0.9s_var(--ease-expo)_0.9s_both]"
        >
          {chamada.texto}
          <ArrowRight className="size-[1.15em]" strokeWidth={2.8} aria-hidden />
        </a>
      </div>

      <a
        href="#aulas"
        onClick={(e) => {
          e.preventDefault();
          irPara("aulas", "abertura_seta");
        }}
        aria-label="Ver as aulas-show"
        className="absolute bottom-[max(18px,3svh)] left-1/2 grid size-11 -translate-x-1/2 place-items-center rounded-full border border-texto/35 bg-fundo/55 text-texto backdrop-blur-sm"
      >
        <ChevronDown className="size-5 [animation:desce_1.8s_ease-in-out_infinite]" aria-hidden />
      </a>
    </section>
  );
}
