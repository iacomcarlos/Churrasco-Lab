"use client";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { track } from "@/lib/analytics";

const CHAVE = "churrascolab:som:v1";
const VOLUME = 0.14; // baixo e discreto

/**
 * Som ambiente de brasa crepitando, bem baixo, em repetição.
 *
 * Ele tenta tocar sozinho assim que a página abre. Os navegadores (principalmente no celular)
 * costumam bloquear som automático; quando isso acontece, o som começa no primeiro toque, clique
 * ou tecla do visitante, sem ele precisar procurar botão nenhum. O botão ao lado serve para
 * silenciar, e a escolha fica guardada no aparelho. Com a aba em segundo plano, o som pausa.
 */
export function Som() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [mudo, setMudo] = useState(false);
  const [tocando, setTocando] = useState(false);
  const mudoRef = useRef(false);

  useEffect(() => {
    let preferiuMudo = false;
    try {
      preferiuMudo = window.localStorage.getItem(CHAVE) === "mudo";
    } catch {
      /* sem armazenamento */
    }
    mudoRef.current = preferiuMudo;
    setMudo(preferiuMudo);

    const a = new Audio();
    a.loop = true;
    a.preload = "none";
    a.volume = 0;
    a.src = "/audio/brasa.m4a";
    audio.current = a;
    let subida = 0;

    const tocar = () => {
      if (mudoRef.current || document.hidden) return Promise.resolve(false);
      return a
        .play()
        .then(() => {
          setTocando(true);
          window.clearInterval(subida);
          subida = window.setInterval(() => {
            a.volume = Math.min(VOLUME, a.volume + 0.01);
            if (a.volume >= VOLUME) window.clearInterval(subida);
          }, 90);
          return true;
        })
        .catch(() => false);
    };

    // se o navegador bloquear o som automático, ele começa no primeiro gesto do visitante
    const gestos = ["pointerdown", "keydown", "touchend"] as const;
    const noGesto = () => {
      tocar().then((ok) => ok && gestos.forEach((g) => window.removeEventListener(g, noGesto)));
    };
    gestos.forEach((g) => window.addEventListener(g, noGesto, { passive: true }));
    tocar().then((ok) => ok && gestos.forEach((g) => window.removeEventListener(g, noGesto)));

    const visibilidade = () => {
      if (document.hidden) a.pause();
      else if (!mudoRef.current) tocar();
    };
    document.addEventListener("visibilitychange", visibilidade);
    const aoParar = () => setTocando(false);
    a.addEventListener("pause", aoParar);

    return () => {
      window.clearInterval(subida);
      gestos.forEach((g) => window.removeEventListener(g, noGesto));
      document.removeEventListener("visibilitychange", visibilidade);
      a.removeEventListener("pause", aoParar);
      a.pause();
      audio.current = null;
    };
  }, []);

  const alternar = () => {
    const a = audio.current;
    if (!a) return;
    const novo = !mudo;
    mudoRef.current = novo;
    setMudo(novo);
    try {
      window.localStorage.setItem(CHAVE, novo ? "mudo" : "som");
    } catch {
      /* ok */
    }
    if (novo) a.pause();
    else {
      a.volume = VOLUME;
      a.play().then(() => setTocando(true)).catch(() => undefined);
    }
    track("som", { ligado: !novo });
  };

  const ligado = !mudo && tocando;
  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={!mudo}
      aria-label={mudo ? "Ligar o som de brasa" : "Silenciar o som de brasa"}
      title={mudo ? "Ligar o som" : "Silenciar"}
      className="grid size-[42px] shrink-0 place-items-center rounded-full border border-texto/25 bg-fundo/60 text-texto backdrop-blur-sm transition-colors hover:border-ambar"
    >
      {ligado ? <Volume2 className="size-[18px]" aria-hidden /> : <VolumeX className="size-[18px] opacity-70" aria-hidden />}
    </button>
  );
}
