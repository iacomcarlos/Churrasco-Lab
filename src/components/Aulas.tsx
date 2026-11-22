"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Plus, X } from "lucide-react";
import { aulaDoProfissional, aulas, aulasDoDia, dias, diaDaAula, hora, nomeNaProgramacao, profissionais, profissionalPorId, type Aula, type Profissional } from "@/config/evento";
import { inscricaoAtiva } from "@/config/inscricao";
import { TituloSecao } from "@/components/Pecas";
import { useRevelar } from "@/lib/revelar";
import { lista, useLista } from "@/lib/lista";
import { situacoes, type Situacao } from "@/lib/tempo";
import { irPara } from "@/lib/nav";
import { track } from "@/lib/analytics";

function Cartao({ aula, marcada, sit, abrir, i }: { aula: Aula; marcada: boolean; sit?: Situacao; abrir: (p: Profissional) => void; i: number }) {
  const prof = profissionalPorId(aula.profissional);
  const encerrada = sit === "encerrada";
  return (
    <li
      data-rev
      style={{ ["--atraso" as string]: `${i * 0.06}s` }}
      className={`cartao flex min-w-0 flex-col overflow-hidden !p-0 transition-[border-color,box-shadow,opacity] duration-300 sm:flex-row ${marcada ? "!border-brasa shadow-[0_0_0_1px_var(--color-brasa),0_14px_36px_-18px_rgb(244_122_18/0.7)]" : ""} ${encerrada ? "opacity-55" : ""}`}
    >
      {/* a foto é o destaque do cartão; o nome vai por cima dela, na parte escura de baixo */}
      <button type="button" onClick={() => abrir(prof)} aria-label={`Ver perfil de ${prof.nomeCompleto || nomeNaProgramacao(prof)}`} className="group relative block aspect-[5/4.6] w-full shrink-0 overflow-hidden bg-fundo text-left sm:aspect-auto sm:min-h-[330px] sm:w-[44%]">
        {prof.foto ? (
          <img src={prof.foto} alt="" width={880} height={1100} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={{ objectPosition: prof.foco }} />
        ) : (
          /* sem foto oficial: inicial do nome, nada de retrato inventado */
          <span aria-hidden className="titulo absolute inset-0 grid place-items-center bg-cartao-2 text-[90px] text-brasa">
            {prof.nome[0]}
          </span>
        )}
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-[rgb(12_7_5/0.96)] via-[rgb(12_7_5/0.6)] to-transparent" />
        <span className="absolute inset-x-0 bottom-0 px-5 pb-4">
          <span className="block text-[clamp(22px,6.2vw,26px)] leading-[1.05] font-extrabold tracking-[-0.02em] text-texto sm:text-[23px]">{prof.nome}</span>
          {prof.marca && <span className="manuscrito mt-0.5 block text-[24px] leading-[1.1] sm:text-[22px]">{prof.marca}</span>}
        </span>
      </button>

      <div className="flex min-w-0 flex-1 flex-col p-5 sm:py-6">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-bold text-ambar">
          <time dateTime={`${aula.data}T${aula.inicio}-03:00`}>{hora(aula.inicio)}</time>
          <span className="font-medium text-suave">às {hora(aula.fim)}</span>
          {sit === "andamento" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brasa px-2 py-0.5 text-[10.5px] tracking-[0.12em] text-tinta uppercase">
              <span className="size-1.5 rounded-full bg-tinta" /> agora
            </span>
          )}
          {encerrada && <span className="rounded-full border border-suave/40 px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.12em] text-suave uppercase">encerrada</span>}
        </p>
        <h4 className="mt-1.5 text-[clamp(20px,5.6vw,24px)] leading-[1.12] font-extrabold tracking-[-0.02em] [overflow-wrap:anywhere] sm:text-[22px]">{aula.tema}</h4>
        {/* mini currículo, do material enviado pelo próprio profissional */}
        {prof.bio?.[0] && (
          <p className="mt-3 border-l-2 border-brasa/60 pl-3 text-[14.5px] leading-[1.55] text-texto/85">
            {prof.bio[0]}{" "}
            {prof.bio.length > 1 && (
              <button type="button" onClick={() => abrir(prof)} className="font-bold whitespace-nowrap text-ambar underline underline-offset-2">
                ver mais
              </button>
            )}
          </p>
        )}
        <span aria-hidden className="min-h-5 flex-1" />
        {inscricaoAtiva && (
          <button
            type="button"
            aria-pressed={marcada}
            aria-label={marcada ? `Tirar ${aula.tema} da minha inscrição` : `Quero assistir ${aula.tema}`}
            onClick={() => {
              lista.alternar(aula.id);
              track("aula_marcar", { aula: aula.id, marcada: !marcada });
            }}
            className={`btn btn-sm w-full ${marcada ? "btn-brasa" : "btn-linha"}`}
          >
            {marcada ? <Check className="size-4" strokeWidth={3} aria-hidden /> : <Plus className="size-4" strokeWidth={2.6} aria-hidden />}
            {marcada ? "Aula escolhida" : "Quero esta aula"}
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * AULAS-SHOW: as seis aulas à vista, separadas por dia. Cada cartão mostra foto, horário,
 * tema e quem ensina. O botão "Quero esta aula" escolhe a aula para a inscrição. A foto e o mini currículo são o destaque do cartão.
 */
export function Aulas() {
  const root = useRef<HTMLElement>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const [agora, setAgora] = useState<Date | null>(null);
  const [aberto, setAberto] = useState<Profissional | null>(null);
  const marcadas = useLista();
  useRevelar(root);

  useEffect(() => {
    setAgora(new Date());
    const id = window.setInterval(() => setAgora(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  const sit = agora ? situacoes(agora) : null;
  const abrir = (p: Profissional) => {
    setAberto(p);
    track("perfil_abrir", { profissional: p.id });
  };
  const aulaAberta = aberto ? aulaDoProfissional(aberto.id) : undefined;
  const marcadaAberta = aulaAberta ? marcadas.includes(aulaAberta.id) : false;
  const n = marcadas.length;
  let ordem = 0;

  return (
    <section id="aulas" ref={root} className="relative bg-white/[0.022] px-5 py-20 sm:py-24">
      <TituloSecao frase="Bora aprender" titulo="Aulas-show" apoio={inscricaoAtiva ? "Conheça quem ensina e escolha as suas aulas." : `${aulas.length} aulas em ${dias.length} dias. ${profissionais.length} profissionais.`} />

      <div className="mx-auto mt-10 max-w-[1040px] space-y-10">
        {dias.map((d) => (
          <div key={d.id}>
            <h3 data-rev className="flex items-center justify-center gap-4">
              <span aria-hidden className="h-px w-10 bg-brasa/50 sm:w-20" />
              <span className="rounded-full border-[1.5px] border-brasa/75 px-5 py-2 text-[15px] font-bold tracking-[0.14em] uppercase">
                {d.semanaCurta} <span className="text-ambar">· {d.rotulo}</span>
              </span>
              <span aria-hidden className="h-px w-10 bg-brasa/50 sm:w-20" />
            </h3>
            <ul className="mx-auto mt-5 grid max-w-[440px] grid-cols-1 gap-4 sm:max-w-[620px] lg:max-w-none lg:grid-cols-2">
              {aulasDoDia(d.data).map((a) => (
                <Cartao key={a.id} aula={a} marcada={marcadas.includes(a.id)} sit={sit?.[a.id]} abrir={abrir} i={ordem++ % 2} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      {inscricaoAtiva && (
        <div data-rev className="mt-10 flex flex-col items-center gap-3 text-center">
          <p aria-live="polite" className="text-[15px] font-semibold text-suave">
            {n === 0 ? "Nenhuma aula escolhida ainda." : n === 1 ? "1 aula escolhida." : `${n} aulas escolhidas.`}
          </p>
          <button type="button" onClick={() => irPara("inscricao", "aulas")} className="btn btn-brasa w-full max-w-[400px]">
            {n ? "Continuar inscrição" : "Fazer inscrição"}
            <ArrowRight className="size-5" strokeWidth={2.8} aria-hidden />
          </button>
        </div>
      )}

      {/* perfil: só o que veio do material enviado pelo próprio profissional */}
      <dialog
        ref={dlg}
        onClose={() => setAberto(null)}
        onClick={(e) => e.target === dlg.current && setAberto(null)}
        aria-labelledby="perfil-nome"
        className="m-0 mt-auto mb-0 max-h-[92svh] w-full max-w-none overflow-hidden rounded-t-[28px] border border-b-0 border-[rgb(255_190_130/0.18)] bg-cartao p-0 text-texto backdrop:bg-black/75 backdrop:backdrop-blur-sm sm:m-auto sm:max-w-[760px] sm:rounded-[28px] sm:border-b"
      >
        {aberto && (
          <div className="grid max-h-[92svh] overflow-y-auto sm:grid-cols-[0.82fr_1.18fr]">
            <div className="relative h-[36svh] min-h-[230px] bg-fundo sm:h-auto sm:min-h-[480px]">
              {aberto.foto && <img src={aberto.foto} alt={`Foto de ${aberto.nomeCompleto || aberto.nome}`} width={880} height={1100} className="absolute inset-0 size-full object-cover" style={{ objectPosition: aberto.foco }} />}
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-cartao to-transparent sm:hidden" />
            </div>
            <div className="p-6 text-center sm:p-8 sm:text-left">
              <h3 id="perfil-nome" className="titulo text-[clamp(26px,7vw,34px)]">
                {aberto.nomeCompleto || aberto.nome}
              </h3>
              {aberto.marca && <p className="manuscrito mt-1 inline-block text-[28px]">{aberto.marca}</p>}
              <div className="mt-4 space-y-3 text-left text-[15.5px] leading-[1.6] text-texto/85">
                {aberto.bio?.map((b, i) => <p key={i}>{b}</p>)}
              </div>
              {aulaAberta && (
                <div className="mt-6 rounded-[20px] border border-[rgb(255_190_130/0.16)] bg-cartao-2 p-4 text-left">
                  <p className="text-[13.5px] font-bold text-ambar">
                    {diaDaAula(aulaAberta).semana}, {diaDaAula(aulaAberta).diaMes} · {hora(aulaAberta.inicio)} às {hora(aulaAberta.fim)}
                  </p>
                  <p className="titulo mt-1.5 text-[20px]">{aulaAberta.tema}</p>
                  {inscricaoAtiva && (
                    <button type="button" aria-pressed={marcadaAberta} onClick={() => lista.alternar(aulaAberta.id)} className={`btn btn-sm mt-4 w-full ${marcadaAberta ? "btn-brasa" : "btn-linha"}`}>
                      {marcadaAberta ? <Check className="size-4" strokeWidth={3} aria-hidden /> : <Plus className="size-4" strokeWidth={2.6} aria-hidden />}
                      {marcadaAberta ? "Aula escolhida" : "Quero esta aula"}
                    </button>
                  )}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setAberto(null)} aria-label="Fechar" className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-fundo/85 text-texto backdrop-blur-sm">
              <X className="size-5" aria-hidden />
            </button>
          </div>
        )}
      </dialog>
    </section>
  );
}
