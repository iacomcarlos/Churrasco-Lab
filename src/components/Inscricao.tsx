"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarPlus, Check, LoaderCircle, Share2 } from "lucide-react";
import { aulas, aulasDoDia, dias, diaDaAula, evento, hora, textos } from "@/config/evento";
import { inscricao, inscricaoAtiva, regioes } from "@/config/inscricao";
import { TituloSecao } from "@/components/Pecas";
import { useRevelar } from "@/lib/revelar";
import { lista, useLista } from "@/lib/lista";
import { baixarIcs } from "@/lib/calendario";
import { compartilharWhatsApp } from "@/lib/share";
import { track } from "@/lib/analytics";

const CHAVE = "churrascolab:inscrito:v1";
type Feito = { nome: string; aulas: string[] };
type Erros = Partial<Record<"aulas" | "nome" | "whatsapp" | "email" | "cidade" | "envio", string>>;

const mascara = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

/**
 * INSCRIÇÃO, simples e em um cartão só: escolher as aulas (um toque em cada) e três dados.
 * Grava direto no banco da organização. Sem cadastro, sem senha, sem etapas escondidas.
 */
export function Inscricao() {
  const root = useRef<HTMLElement>(null);
  const marcadas = useLista();
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [email, setEmail] = useState("");
  const [cidade, setCidade] = useState("");
  const [mel, setMel] = useState(""); // campo-isca contra robôs
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState<Feito | null>(null);
  const inicio = useRef(0);
  useRevelar(root);

  useEffect(() => {
    inicio.current = Date.now();
    try {
      const salvo = JSON.parse(window.localStorage.getItem(CHAVE) || "null");
      if (salvo?.nome && Array.isArray(salvo.aulas)) setFeito(salvo);
    } catch {
      /* sem armazenamento */
    }
  }, []);

  if (!inscricaoAtiva) {
    // Site público: sem banco configurado, a seção não aparece (nenhuma promessa falsa de inscrição).
    if (process.env.NODE_ENV === "production") return null;
    return (
      <section id="inscricao" className="bg-fundo px-5 py-16">
        <div className="mx-auto max-w-[560px] rounded-2xl border-2 border-dashed border-ambar/60 p-6 text-[15px]">
          <strong className="text-ambar">Configuração pendente (só aparece no desenvolvimento).</strong> As inscrições não estão ligadas a um banco. Veja <code>src/config/inscricao.ts</code>.
        </div>
      </section>
    );
  }

  const todas = marcadas.length === aulas.length;
  const limpar = (k: keyof Erros) => setErros((e) => (e[k] || e.envio ? { ...e, [k]: undefined, envio: undefined } : e));

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (enviando) return;
    const e: Erros = {};
    if (!marcadas.length) e.aulas = "Escolha pelo menos uma aula.";
    if (nome.trim().length < 3) e.nome = "Escreva seu nome.";
    if (whats.replace(/\D/g, "").length < 10) e.whatsapp = "Informe o WhatsApp com DDD.";
    const em = email.trim();
    if (em ? !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em) : inscricao.emailObrigatorio) e.email = "Confira o e-mail.";
    if (!cidade) e.cidade = "Escolha onde você mora.";
    setErros(e);
    const primeiro = Object.keys(e)[0];
    if (primeiro) {
      root.current?.querySelector<HTMLElement>(`[data-campo="${primeiro}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    // robôs preenchem o campo invisível ou enviam em menos de 2 segundos: finge sucesso e não grava nada
    const robo = Boolean(mel) || Date.now() - inicio.current < 2000;
    setEnviando(true);
    try {
      if (!robo) {
        const r = await fetch(`${inscricao.url}/rest/v1/${inscricao.tabela}`, {
          method: "POST",
          headers: { apikey: inscricao.chave, Authorization: `Bearer ${inscricao.chave}`, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({
            nome: nome.trim().replace(/\s+/g, " ").slice(0, 120),
            whatsapp: whats.replace(/\D/g, ""),
            email: em.toLowerCase().slice(0, 160) || null,
            cidade,
            aulas: marcadas,
            consentimento: true,
          }),
        });
        if (!r.ok) throw new Error(String(r.status));
      }
      const ok: Feito = { nome: nome.trim().split(/\s+/)[0], aulas: marcadas };
      try {
        window.localStorage.setItem(CHAVE, JSON.stringify(ok));
      } catch {
        /* segue sem salvar */
      }
      setFeito(ok);
      track("inscricao_enviada", { aulas: marcadas.length });
      requestAnimationFrame(() => root.current?.querySelector<HTMLElement>("[data-sucesso]")?.focus());
    } catch {
      setErros({ envio: "Não deu para enviar. Confira sua internet e tente de novo." });
      track("inscricao_erro", {});
    } finally {
      setEnviando(false);
    }
  };

  const erro = (k: keyof Erros) =>
    erros[k] ? (
      <p role="alert" className="mt-1.5 text-[13.5px] font-semibold text-[#ff8a75]">
        {erros[k]}
      </p>
    ) : null;

  const aulasFeitas = feito ? aulas.filter((a) => feito.aulas.includes(a.id)) : [];

  return (
    <section id="inscricao" ref={root} className="relative overflow-hidden px-5 py-20 sm:py-24">
      <div aria-hidden className="pointer-events-none absolute top-1/3 left-1/2 size-[min(140vw,900px)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(196_62_12/0.2),transparent)]" />
      <div className="relative">
        <TituloSecao frase="Chega junto!" titulo="Inscrição gratuita" apoio={feito ? undefined : "Leva menos de um minuto."} />

        <div data-rev className="mx-auto mt-9 max-w-[540px]">
          {feito ? (
            <div data-sucesso tabIndex={-1} className="cartao px-6 py-9 text-center outline-none sm:px-9">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-brasa text-tinta" style={{ animation: "pulso 1.8s ease-out 2" }}>
                <Check className="size-8" strokeWidth={3} aria-hidden />
              </span>
              <h3 className="titulo mt-5 text-[clamp(26px,7.4vw,34px)]">Tudo certo, {feito.nome}!</h3>
              <p className="mt-2.5 text-[16px] text-suave">
                Sua inscrição foi recebida. Te esperamos na {evento.local.nome}, em {evento.local.bairro}.
              </p>
              {aulasFeitas.length > 0 && (
                <ul className="mt-6 space-y-2 text-left">
                  {aulasFeitas.map((a) => (
                    <li key={a.id} className="flex items-center gap-3.5 rounded-2xl bg-cartao-2 px-4 py-3">
                      <span className="w-[6.4em] shrink-0 text-[13px] leading-tight font-semibold whitespace-nowrap text-suave">
                        <strong className="block text-[17px] font-extrabold text-ambar">{hora(a.inicio)}</strong>
                        {diaDaAula(a).semanaCurta}, {diaDaAula(a).diaMes}
                      </span>
                      <span className="titulo text-[16px] leading-[1.15]">{a.tema}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {aulasFeitas.length > 0 && (
                  <button type="button" onClick={() => baixarIcs(aulasFeitas, "churrasco-lab-minhas-aulas")} className="btn btn-linha btn-sm">
                    <CalendarPlus className="size-[18px]" aria-hidden /> Salvar na agenda
                  </button>
                )}
                <button type="button" onClick={() => compartilharWhatsApp("inscricao")} className="btn btn-brasa btn-sm">
                  <Share2 className="size-[18px]" aria-hidden /> Chamar a galera
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFeito(null);
                  setNome("");
                  setWhats("");
                  setEmail("");
                  inicio.current = Date.now();
                  try {
                    window.localStorage.removeItem(CHAVE);
                  } catch {
                    /* ok */
                  }
                }}
                className="mt-6 text-[14px] font-semibold text-suave underline underline-offset-4"
              >
                Inscrever outra pessoa
              </button>
            </div>
          ) : (
            <form onSubmit={enviar} noValidate className="cartao px-5 py-7 sm:px-8 sm:py-9">
              {/* 1. aulas: um toque em cada */}
              <fieldset data-campo="aulas">
                <legend className="flex w-full items-center justify-between gap-3">
                  <span className="flex items-center gap-2.5 text-[17px] font-extrabold">
                    <span className="grid size-7 place-items-center rounded-full bg-brasa text-[14px] text-tinta">1</span>
                    Escolha as aulas
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      lista.definir(todas ? [] : aulas.map((a) => a.id));
                      limpar("aulas");
                    }}
                    className="rounded-full border border-brasa/70 px-3.5 py-1.5 text-[13px] font-bold text-ambar"
                  >
                    {todas ? "Limpar" : "Todas"}
                  </button>
                </legend>
                {dias.map((d) => (
                  <div key={d.id} className="mt-4">
                    <p className="text-[12px] font-bold tracking-[0.16em] text-suave uppercase">
                      {d.semanaCurta} · {d.rotulo}
                    </p>
                    <div className="mt-2 grid gap-2">
                      {aulasDoDia(d.data).map((a) => {
                        const on = marcadas.includes(a.id);
                        return (
                          <label
                            key={a.id}
                            className={`flex min-h-[54px] cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] px-3.5 py-2 transition-[background-color,border-color] duration-200 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ambar ${
                              on ? "border-brasa bg-brasa/15" : "border-[rgb(255_190_130/0.2)] bg-cartao-2"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => {
                                lista.alternar(a.id);
                                limpar("aulas");
                              }}
                              className="sr-only"
                            />
                            <span aria-hidden className={`grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors ${on ? "border-brasa bg-brasa text-tinta" : "border-suave/50"}`}>
                              {on && <Check className="size-4" strokeWidth={3.5} />}
                            </span>
                            <span className="w-[3.3em] shrink-0 text-[15px] font-extrabold text-ambar">{hora(a.inicio)}</span>
                            <span className="min-w-0 text-[15px] leading-[1.2] font-bold">{a.tema}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {erro("aulas")}
              </fieldset>

              {/* 2. dados */}
              <fieldset className="mt-8">
                <legend className="flex items-center gap-2.5 text-[17px] font-extrabold">
                  <span className="grid size-7 place-items-center rounded-full bg-brasa text-[14px] text-tinta">2</span>
                  Seus dados
                </legend>
                <div className="mt-4 grid gap-3">
                  <div data-campo="nome">
                    <label htmlFor="i-nome" className="sr-only">Nome completo</label>
                    <input id="i-nome" className="campo" autoComplete="name" autoCapitalize="words" maxLength={120} value={nome} onChange={(e) => { setNome(e.target.value); limpar("nome"); }} aria-invalid={Boolean(erros.nome)} placeholder="Nome completo" />
                    {erro("nome")}
                  </div>
                  <div data-campo="whatsapp">
                    <label htmlFor="i-whats" className="sr-only">WhatsApp com DDD</label>
                    <input id="i-whats" className="campo" type="tel" inputMode="numeric" autoComplete="tel-national" value={whats} onChange={(e) => { setWhats(mascara(e.target.value)); limpar("whatsapp"); }} aria-invalid={Boolean(erros.whatsapp)} placeholder="WhatsApp com DDD" />
                    {erro("whatsapp")}
                  </div>
                  <div data-campo="email">
                    <label htmlFor="i-email" className="sr-only">E-mail{inscricao.emailObrigatorio ? "" : " (opcional)"}</label>
                    <input id="i-email" className="campo" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" maxLength={160} value={email} onChange={(e) => { setEmail(e.target.value); limpar("email"); }} aria-invalid={Boolean(erros.email)} placeholder={inscricao.emailObrigatorio ? "E-mail" : "E-mail (opcional)"} />
                    {erro("email")}
                  </div>
                  <div data-campo="cidade">
                    <label htmlFor="i-cidade" className="sr-only">Onde você mora</label>
                    <div className="relative">
                      <select id="i-cidade" className={`campo pr-11 ${cidade ? "" : "!font-medium !text-[#94867a]"}`} value={cidade} onChange={(e) => { setCidade(e.target.value); limpar("cidade"); }} aria-invalid={Boolean(erros.cidade)}>
                        <option value="">Onde você mora</option>
                        {regioes.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <span aria-hidden className="pointer-events-none absolute top-1/2 right-5 size-2.5 -translate-y-[70%] rotate-45 border-r-2 border-b-2 border-ambar" />
                    </div>
                    {erro("cidade")}
                  </div>
                </div>
                {/* campo-isca: invisível para pessoas */}
                <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>
                    Site
                    <input tabIndex={-1} autoComplete="off" value={mel} onChange={(e) => setMel(e.target.value)} />
                  </label>
                </div>
              </fieldset>

              <button type="submit" disabled={enviando} className="btn btn-brasa mt-7 w-full !min-h-[62px] !px-4 !text-[clamp(15px,4.2vw,17px)] whitespace-nowrap disabled:opacity-80">
                {enviando && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
                {enviando ? "Enviando..." : "Confirmar inscrição"}
                {!enviando && <ArrowRight className="size-5" strokeWidth={2.8} aria-hidden />}
              </button>
              <div data-campo="envio" className="text-center">{erro("envio")}</div>
              <p className="mt-4 text-center text-[12.5px] leading-snug text-suave">{textos.privacidade}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
