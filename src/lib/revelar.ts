"use client";
import { useEffect, type RefObject } from "react";

/**
 * Entradas discretas ao rolar: elementos com `data-rev` sobem e aparecem uma vez.
 * Sem JavaScript ou com "reduzir movimento", tudo já nasce visível (ver globals.css).
 */
export function useRevelar(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const raiz = scope.current;
    if (!raiz) return;
    const els = raiz.querySelectorAll<HTMLElement>("[data-rev]");
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("visto"));
      return;
    }
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas)
          if (e.isIntersecting) {
            e.target.classList.add("visto");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [scope]);
}
