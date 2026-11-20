import { inscricaoAtiva } from "@/config/inscricao";
import { track } from "./analytics";

/**
 * Chamada principal do site. Com as inscrições ligadas, leva ao formulário.
 * Sem banco configurado, leva à programação (nenhum link falso de inscrição).
 */
export const chamada = inscricaoAtiva
  ? { id: "inscricao", texto: "Inscreva-se grátis", curto: "Inscreva-se" }
  : { id: "aulas", texto: "Ver aulas-show", curto: "Aulas-show" };

export function irPara(id: string, local: string) {
  track(id === "inscricao" ? "inscricao_click" : id === "aulas" ? "programacao_click" : "nav_click", { local, destino: id });
  const el = document.getElementById(id);
  if (!el) return;
  const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduz ? "auto" : "smooth", block: "start" });
}
