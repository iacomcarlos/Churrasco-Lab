/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import { evento } from "@/config/evento";

/** Versão branca de 1 cor, para tamanhos pequenos (cabeçalho). */
export function LogoBranca({ className = "" }: { className?: string }) {
  return <img src="/brand/logo-branca.png" width={275} height={235} alt={evento.nomeCurto} className={className} decoding="async" draggable={false} />;
}

/** Traço à mão sob as frases manuscritas, como no flyer. */
export function Rabisco({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 14" aria-hidden className={className} fill="none">
      <defs>
        <linearGradient id="rabisco" x1="0" x2="1">
          <stop offset="0" stopColor="#ffd45e" />
          <stop offset="1" stopColor="#f47a12" />
        </linearGradient>
      </defs>
      <path d="M5 10C58 3 150 2 215 6" stroke="url(#rabisco)" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

/** Cabeçalho padrão de seção: frase manuscrita, título forte e uma linha de apoio. Tudo centralizado. */
export function TituloSecao({ frase, titulo, apoio, id }: { frase: string; titulo: ReactNode; apoio?: ReactNode; id?: string }) {
  return (
    <header className="mx-auto flex max-w-[640px] flex-col items-center text-center">
      <p data-rev className="manuscrito text-[clamp(34px,9.5vw,46px)]">
        {frase}
      </p>
      <Rabisco className="-mt-1 w-[150px]" />
      <h2 data-rev id={id} className="titulo mt-4 text-[clamp(30px,8.6vw,48px)]">
        {titulo}
      </h2>
      {apoio && (
        <p data-rev className="mt-3 max-w-[30em] text-[clamp(15.5px,4.1vw,17.5px)] text-suave">
          {apoio}
        </p>
      )}
    </header>
  );
}
