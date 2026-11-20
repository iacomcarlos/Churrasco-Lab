import { aulas, type Aula } from "@/config/evento";

/**
 * Horário de Brasília (America/Sao_Paulo). O Brasil não tem horário de verão desde 2019,
 * então o deslocamento é fixo em UTC-3: os horários oficiais viram instantes exatos,
 * iguais em qualquer celular, não importa o fuso do aparelho.
 */
const FUSO = "-03:00";

export const instante = (data: string, hora: string) => new Date(`${data}T${hora}:00${FUSO}`);
export const inicioDa = (a: Aula) => instante(a.data, a.inicio);
export const fimDa = (a: Aula) => instante(a.data, a.fim);

export type Situacao = "futura" | "proxima" | "andamento" | "encerrada";

/** Situação de cada aula calculada só pelos horários oficiais. */
export function situacoes(agora: Date): Record<string, Situacao> {
  const out: Record<string, Situacao> = {};
  let proximaMarcada = false;
  for (const a of aulas) {
    const ini = inicioDa(a).getTime();
    const fim = fimDa(a).getTime();
    const t = agora.getTime();
    if (t >= fim) out[a.id] = "encerrada";
    else if (t >= ini) out[a.id] = "andamento";
    else if (!proximaMarcada) {
      out[a.id] = "proxima";
      proximaMarcada = true;
    } else out[a.id] = "futura";
  }
  return out;
}

export const primeiraAula = aulas[0];
export const ultimaAula = aulas[aulas.length - 1];

/** Duração em minutos. */
export const duracao = (a: Aula) => Math.round((fimDa(a).getTime() - inicioDa(a).getTime()) / 60000);

export function duracaoTexto(a: Aula) {
  const m = duracao(a);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h}h${r ? String(r).padStart(2, "0") : ""}` : `${r} min`;
}
