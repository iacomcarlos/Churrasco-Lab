import type { CSSProperties } from "react";

/**
 * Faíscas subindo por todo o site: uma camada fixa, leve e discreta, por cima do fundo.
 *
 * Feita só com CSS (transform e opacidade), sem JavaScript rodando a cada quadro, para não
 * pesar no celular. Não recebe toque nem clique, fica abaixo do cabeçalho e do botão fixo,
 * e desaparece por completo com "reduzir movimento" ligado.
 */

// sorteio com semente fixa: as mesmas faíscas no servidor e no navegador
function semente(s: number) {
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TOTAL = 80; // no celular aparecem só as 42 primeiras
const r = semente(2026);
const FAISCAS = Array.from({ length: TOTAL }, (_, i) => {
  const tamanho = 2 + r() * 3.4;
  const duracao = 1.6 + r() * 2.6;
  return {
    i,
    estilo: {
      "--x": `${(2 + r() * 96).toFixed(2)}%`,
      "--t": `${tamanho.toFixed(2)}px`,
      "--d": `${duracao.toFixed(2)}s`,
      "--a": `${(-r() * duracao).toFixed(2)}s`,
      "--b": `${(0.35 + r() * 0.6).toFixed(2)}s`,
      "--h": `${(38 + r() * 70).toFixed(0)}vh`,
      "--dx": `${((r() - 0.5) * 160).toFixed(0)}px`,
      "--o": (0.55 + r() * 0.4).toFixed(2),
    } as CSSProperties,
  };
});

export function Faiscas() {
  return (
    <div className="faiscas" aria-hidden>
      {FAISCAS.map((f) => (
        <span key={f.i} className={`faisca ${f.i >= 42 ? "max-md:hidden" : ""}`} style={f.estilo}>
          <i />
        </span>
      ))}
    </div>
  );
}
