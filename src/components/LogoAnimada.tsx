"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import camadas from "@/config/logo-camadas.json";
import { evento } from "@/config/evento";

type Id = keyof typeof camadas;
type Estado = "espera" | "entrada" | "vivo";

const caixa = (id: Id): CSSProperties => {
  const c = camadas[id];
  return { left: `${c.x}%`, top: `${c.y}%`, width: `${c.w}%`, height: `${c.h}%` };
};

function Camada({ id, classe = "", prioridade = false, preguica = false }: { id: Id; classe?: string; prioridade?: boolean; preguica?: boolean }) {
  const c = camadas[id];
  return (
    <img
      src={c.src}
      width={c.largura}
      height={c.altura}
      alt=""
      className={`lg-c lg-${id} ${classe}`}
      style={caixa(id)}
      decoding="async"
      loading={preguica ? "lazy" : "eager"}
      fetchPriority={prioridade ? "high" : "auto"}
      draggable={false}
    />
  );
}

/** Reflexo de luz que atravessa uma palavra, recortado pela própria camada (sem bordas artificiais). */
function Reflexo({ id }: { id: Id }) {
  const m = `url(${camadas[id].src}) center / 100% 100% no-repeat`;
  return <span className={`lg-reflexo lg-reflexo-${id}`} style={{ ...caixa(id), WebkitMask: m, mask: m }} />;
}

/* faíscas discretas subindo do fogo: posição (x, y em % da logo), duração e atraso */
const FAISCAS = [
  [27, 37, 3.4, 0.2],
  [36, 30, 2.8, 1.5],
  [44, 23, 3.8, 0.8],
  [53, 20, 3.1, 2.3],
  [61, 26, 3.6, 1.1],
  [69, 33, 2.9, 2.9],
  [76, 38, 3.3, 0.5],
] as const;

/**
 * Logo oficial animada, montada com as camadas originais (fogo, vapores, palavras, facas e pontos).
 *
 * Tudo acontece NO LUGAR: o fogo sobe por uma máscara suave, as palavras acendem com uma varredura
 * de luz e o vapor cresce para cima. Nenhuma peça é deslocada, porque as camadas foram separadas de
 * uma imagem pronta e, fora do lugar, mostrariam emendas. Depois da entrada, a logo fica "viva":
 * a chama tremula, o vapor oscila e um reflexo passa pelas letras de tempos em tempos.
 *
 * Sem JavaScript ou com "reduzir movimento", aparece a logo completa e parada.
 */
export function LogoAnimada({ entrada = false, className = "" }: { entrada?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<Estado>(entrada ? "espera" : "vivo");
  const [visivel, setVisivel] = useState(entrada);
  const [clarao, setClarao] = useState(false);

  // a entrada só começa quando todas as camadas carregaram (ou depois de 2,5 s, para nunca travar)
  useEffect(() => {
    if (!entrada) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEstado("vivo");
      return;
    }
    let ativo = true;
    let fim = 0;
    const imgs = Array.from(el.querySelectorAll("img"));
    const prontas = Promise.all(
      imgs.map((i) =>
        i.complete
          ? (i.decode?.().catch(() => undefined) ?? Promise.resolve())
          : new Promise<void>((ok) => {
              i.addEventListener("load", () => ok(), { once: true });
              i.addEventListener("error", () => ok(), { once: true });
            }),
      ),
    );
    Promise.race([prontas, new Promise((ok) => window.setTimeout(ok, 2500))]).then(() => {
      if (!ativo) return;
      setEstado("entrada");
      fim = window.setTimeout(() => ativo && setEstado("vivo"), 3700);
    });
    return () => {
      ativo = false;
      window.clearTimeout(fim);
    };
  }, [entrada]);

  // fora da tela, as animações contínuas ficam pausadas (bateria)
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setVisivel(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting), { rootMargin: "10% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // toque na logo: um clarão rápido na chama
  const acender = () => {
    if (estado !== "vivo" || clarao) return;
    setClarao(true);
    window.setTimeout(() => setClarao(false), 1000);
  };

  return (
    <div ref={ref} role="img" aria-label={evento.nomeCurto} onPointerDown={acender} data-estado={estado} data-visivel={visivel ? "sim" : "nao"} data-clarao={clarao ? "sim" : undefined} className={`logo ${className}`}>
      <Camada id="brilho" preguica={!entrada} />
      <Camada id="fogo" prioridade={entrada} preguica={!entrada} />
      {/* a mesma camada do fogo, só como luz por cima: é ela que tremula */}
      <Camada id="fogo" classe="lg-fogo-luz" preguica={!entrada} />
      <Camada id="vapor-esq" preguica={!entrada} />
      <Camada id="vapor-centro" preguica={!entrada} />
      <Camada id="vapor-dir" preguica={!entrada} />
      <Camada id="churrasco" prioridade={entrada} preguica={!entrada} />
      <Reflexo id="churrasco" />
      <Camada id="lab" preguica={!entrada} />
      <Reflexo id="lab" />
      <Camada id="faca-esq" preguica={!entrada} />
      <Camada id="faca-dir" preguica={!entrada} />
      <Camada id="brasilia" preguica={!entrada} />
      <Camada id="ponto-esq" preguica={!entrada} />
      <Camada id="ponto-dir" preguica={!entrada} />
      {FAISCAS.map(([x, y, d, a], i) => (
        <span key={i} className="lg-faisca" style={{ left: `${x}%`, top: `${y}%`, ["--d" as string]: `${d}s`, ["--a" as string]: `${a}s`, ["--dx" as string]: `${(i % 2 ? 1 : -1) * (4 + (i % 3) * 3)}%` }} />
      ))}
    </div>
  );
}
