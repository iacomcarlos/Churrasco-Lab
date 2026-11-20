import { SITE_URL, evento, nomeNaProgramacao, profissionalPorId, type Aula } from "@/config/evento";
import { fimDa, inicioDa } from "./tempo";
import { track } from "./analytics";

const local = `${evento.local.nome}, ${evento.local.bairro}, ${evento.local.ufSigla}`;

const titulo = (a: Aula) => `Aula-show: ${a.tema} | ${evento.nomeCurto}`;
const descricao = (a: Aula) =>
  `Aula-show "${a.tema}" com ${nomeNaProgramacao(profissionalPorId(a.profissional))}. ${evento.entrada}. ${SITE_URL}`;

/** 20261127T183000 (horário de parede de Brasília) */
const parede = (a: Aula, h: string) => `${a.data.replace(/-/g, "")}T${h.replace(":", "")}00`;
/** 20261127T213000Z (UTC) */
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** Arquivo .ics com uma ou várias aulas, no fuso America/Sao_Paulo. */
export function gerarIcs(lista: Aula[]) {
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Churrasco LAB Brasilia//Aulas-show 2026//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    "TZID:America/Sao_Paulo",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:-0300",
    "TZOFFSETTO:-0300",
    "TZNAME:-03",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];
  const carimbo = utc(new Date());
  for (const a of lista) {
    linhas.push(
      "BEGIN:VEVENT",
      `UID:aula-${a.id}-2026@churrascolabbsb.com.br`,
      `DTSTAMP:${carimbo}`,
      `DTSTART;TZID=America/Sao_Paulo:${parede(a, a.inicio)}`,
      `DTEND;TZID=America/Sao_Paulo:${parede(a, a.fim)}`,
      `SUMMARY:${esc(titulo(a))}`,
      `DESCRIPTION:${esc(descricao(a))}`,
      `LOCATION:${esc(local)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:A aula-show começa em 1 hora",
      "TRIGGER:-PT1H",
      "END:VALARM",
      "END:VEVENT",
    );
  }
  linhas.push("END:VCALENDAR");
  return linhas.join("\r\n");
}

export function baixarIcs(lista: Aula[], nome = "churrasco-lab-aulas-show") {
  if (!lista.length) return;
  const blob = new Blob([gerarIcs(lista)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nome}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  track("calendario_add", { metodo: "ics", aulas: lista.map((x) => x.id).join(",") });
}

/** Link direto para criar o evento no Google Agenda. */
export function linkGoogleAgenda(a: Aula) {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: titulo(a),
    dates: `${utc(inicioDa(a))}/${utc(fimDa(a))}`,
    ctz: "America/Sao_Paulo",
    details: descricao(a),
    location: local,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
