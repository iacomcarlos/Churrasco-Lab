"use client";
import { useEffect, type RefObject } from "react";

/**
 * Liga a rolagem a um elemento: grava nele a variável CSS `--p` (de 0 a 1) e o atributo `data-fase`.
 *  - "fixo": cena alta com conteúdo grudado na tela; 0 quando o topo encosta no topo da tela, 1 quando a cena acaba.
 *  - "passagem": 0 quando o elemento começa a entrar por baixo, 1 quando termina de sair por cima.
 * As animações em si ficam no CSS (transform e opacity), então a rolagem continua leve no celular.
 */
export function useProgresso(ref: RefObject<HTMLElement | null>, modo: "fixo" | "passagem" = "fixo") {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const medir = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const bruto = modo === "fixo" ? -r.top / Math.max(1, r.height - vh) : (vh - r.top) / (vh + r.height);
      const p = Math.min(1, Math.max(0, bruto));
      el.style.setProperty("--p", p.toFixed(4));
      el.dataset.fase = p < 0.16 ? "a" : p < 0.9 ? "b" : "c";
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, [ref, modo]);
}
