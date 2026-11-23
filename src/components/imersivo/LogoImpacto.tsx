"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LogoAnimada } from "@/components/LogoAnimada";

/* números "sorteados" sempre iguais, para o servidor e o navegador desenharem a mesma coisa */
const sorteio = (n: number) => {
  let s = 11;
  return Array.from({ length: n }, () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646);
};
const R = sorteio(260);
const ESTILHACOS = Array.from({ length: 44 }, (_, i) => ({ ang: (i / 44) * 360 + R[i] * 9, dist: 9 + R[i + 50] * 17, dur: 0.75 + R[i + 100] * 0.75, tam: 0.7 + R[i + 150] * 1.3 }));
const BRASAS = Array.from({ length: 22 }, (_, i) => ({ x: 6 + R[i + 200] * 88, dur: 2.4 + R[i + 30] * 3, atraso: R[i + 80] * 5, dx: (R[i + 120] - 0.5) * 34, tam: 0.6 + R[i + 170] * 1.1 }));

/**
 * Logo da versão imersiva. Ela nasce NO LUGAR e no tamanho certo (sem vir de longe):
 *  1. as palavras acendem e o fogo sobe por trás delas (a entrada original da logo);
 *  2. quando o fogo termina de subir, ele "pega": um clarão, uma onda de calor e brasas saltando;
 *  3. depois fica viva: labaredas ondulando de verdade (distorção de calor), brasas subindo sem parar
 *     e a peça inteira inclina acompanhando o mouse (no celular, balança sozinha, devagar).
 * A logo é sempre mexida inteira, nunca peça por peça, para não aparecer emenda entre as camadas.
 */
export function LogoImpacto({ className = "" }: { className?: string }) {
  const raiz = useRef<HTMLDivElement>(null);
  const [fase, setFase] = useState<"espera" | "entrada" | "viva">("espera");

  // só começa quando as camadas da logo carregaram (ou em 2,5 s, para nunca travar)
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFase("viva");
      return;
    }
    let vivo = true;
    let fim = 0;
    const imgs = Array.from(el.querySelectorAll("img"));
    imgs.forEach((i) => (i.loading = "eager"));
    const prontas = Promise.all(imgs.map((i) => (i.complete ? Promise.resolve() : new Promise<void>((ok) => ["load", "error"].forEach((ev) => i.addEventListener(ev, () => ok(), { once: true }))))));
    Promise.race([prontas, new Promise((ok) => window.setTimeout(ok, 2500))]).then(() => {
      if (!vivo) return;
      setFase("entrada");
      fim = window.setTimeout(() => vivo && setFase("viva"), 4000);
    });
    return () => {
      vivo = false;
      window.clearTimeout(fim);
    };
  }, []);

  // inclina acompanhando o mouse (só em aparelhos com mouse)
  useEffect(() => {
    const el = raiz.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const aplicar = () => {
      raf = 0;
      el.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`);
    };
    const mover = (e: PointerEvent) => {
      x = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
      y = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1));
      if (!raf) raf = requestAnimationFrame(aplicar);
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", mover);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={raiz} data-fase={fase} className={`logo-impacto ${className}`}>
      {/* distorção de calor usada nas labaredas e nos vapores */}
      <svg aria-hidden width="0" height="0" className="absolute">
        <filter id="li-calor" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.034" numOctaves="2" seed="4" result="ruido">
            <animate attributeName="baseFrequency" dur="6s" values="0.014 0.034;0.02 0.052;0.011 0.028;0.014 0.034" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="ruido" scale="16" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <span aria-hidden className="li-aura" />
      <span aria-hidden className="li-clarao" />
      <span aria-hidden className="li-onda" />
      <span aria-hidden className="li-onda li-onda-2" />

      <div className="li-inclina">
        <div className="li-corpo">
          <LogoAnimada entrada className="w-full" />
        </div>
      </div>

      <span aria-hidden className="li-estilhacos">
        {ESTILHACOS.map((e, i) => (
          <i key={i} style={{ "--ang": `${e.ang}deg`, "--dist": e.dist.toFixed(1), "--dur": `${e.dur}s`, "--tam": e.tam } as CSSProperties} />
        ))}
      </span>
      <span aria-hidden className="li-brasas">
        {BRASAS.map((b, i) => (
          <i key={i} style={{ left: `${b.x}%`, "--dur": `${b.dur}s`, "--atraso": `${b.atraso}s`, "--dx": `${b.dx}%`, "--tam": b.tam } as CSSProperties} />
        ))}
      </span>
    </div>
  );
}
