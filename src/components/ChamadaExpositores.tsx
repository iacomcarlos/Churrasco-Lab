import { ArrowRight, Store } from "lucide-react";
import { expositores } from "@/config/expositores";

/** Faixa curta na página principal, para quem quer expor: leva ao formulário de credenciamento. */
export function ChamadaExpositores() {
  return (
    <section aria-label={expositores.titulo} className="relative px-5 pb-4">
      <div className="cartao mx-auto flex max-w-[720px] flex-col items-center gap-4 px-6 py-6 text-center sm:flex-row sm:text-left">
        <span className="grid size-[54px] shrink-0 place-items-center rounded-full border-[1.5px] border-brasa/70 text-brasa">
          <Store className="size-6" strokeWidth={1.8} aria-hidden />
        </span>
        <p className="min-w-0 flex-1">
          <strong className="titulo block text-[clamp(18px,5vw,22px)]">Quer expor no evento?</strong>
          <span className="mt-1 block text-[14.5px] leading-snug text-suave">O credenciamento de expositores é feito aqui pelo site.</span>
        </p>
        <a href="/expositores" className="btn btn-linha btn-sm w-full shrink-0 sm:w-auto">
          Credenciamento <ArrowRight className="size-4" strokeWidth={2.6} aria-hidden />
        </a>
      </div>
    </section>
  );
}
