"use client";
import { useRef } from "react";
import { CalendarDays, Flame, GraduationCap, Ticket, Utensils } from "lucide-react";
import { aulas, dias, evento, textos } from "@/config/evento";
import { TituloSecao } from "@/components/Pecas";
import { useRevelar } from "@/lib/revelar";

/** O evento em um olhar: três fatos e os dois pilares (a brasa e a escola). Quase sem texto. */
export function Evento() {
  const root = useRef<HTMLElement>(null);
  useRevelar(root);
  const fatos = [
    { Icone: CalendarDays, n: String(dias.length), t: "dias" },
    { Icone: Utensils, n: String(aulas.length), t: "aulas-show" },
    { Icone: Ticket, n: "R$ 0", t: "entrada gratuita" },
  ];
  const icones = { brasa: Flame, escola: GraduationCap } as const;
  return (
    <section id="evento" ref={root} className="relative px-5 py-20 sm:py-24">
      <TituloSecao frase={evento.conceito} titulo={textos.evento.frase} />

      <ul className="mx-auto mt-10 grid max-w-[640px] grid-cols-3 gap-2.5 sm:gap-4">
        {fatos.map(({ Icone, n, t }, i) => (
          <li key={t} data-rev style={{ ["--atraso" as string]: `${i * 0.08}s` }} className="cartao flex flex-col items-center px-2 py-5 text-center">
            <Icone className="size-7 text-brasa" strokeWidth={1.7} aria-hidden />
            <span className="titulo mt-3 text-[clamp(28px,8vw,40px)]">{n}</span>
            <span className="mt-1.5 text-[12.5px] leading-tight font-semibold text-suave sm:text-[14px]">{t}</span>
          </li>
        ))}
      </ul>

      <ul className="mx-auto mt-2.5 grid max-w-[640px] grid-cols-2 gap-2.5 sm:mt-4 sm:gap-4">
        {textos.evento.pilares.map((p, i) => {
          const Icone = icones[p.id as keyof typeof icones];
          return (
            <li key={p.id} data-rev style={{ ["--atraso" as string]: `${0.1 + i * 0.08}s` }} className="cartao flex flex-col items-center px-4 py-6 text-center">
              <span className="grid size-14 place-items-center rounded-full border-[1.5px] border-brasa/70 text-brasa">
                <Icone className="size-7" strokeWidth={1.7} aria-hidden />
              </span>
              <h3 className="titulo mt-4 text-[clamp(18px,5vw,22px)]">{p.titulo}</h3>
              <p className="mt-2 text-[14px] leading-snug text-suave sm:text-[15px]">{p.texto}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
