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

function Retrato({ p, className }: { p: Profissional; className: string }) {
  return p.fotoMini ? (
    <img src={p.fotoMini} alt="" width={240} height={240} loading="lazy" className={`${className} object-cover`} />
  ) : (
    /* sem foto oficial: inicial do nome, nada de retrato inventado */
    <span aria-hidden className={`${className} titulo grid place-items-center bg-cartao-2 text-[34px] text-brasa`}>
      {p.nome[0]}
    </span>
  );
}

function Cartao({ aula, marcada, sit, abrir, i }: { aula: Aula; marcada: boolean; sit?: Situacao; abrir: (p: Profissional) => void; i: number }) {
  const prof = profissionalPorId(aula.profissional);
  const temPerfil = Boolean(prof.bio?.length);
  const encerrada = sit === "encerrada";
  const corpo = (
    <>
      <Retrato p={prof} className="size-[68px] shrink-0 rounded-[16px] sm:size-[96px] sm:rounded-[18px]" />
      <span className="min-w-0 flex-1 text-left">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-bold text-ambar">
          <time dateTime={`${aula.data}T${aula.inicio}-03:00`}>{hora(aula.inicio)}</time>
          <span className="font-medium text-suave">às {hora(aula.fim)}</span>
          {sit === "andamento" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brasa px-2 py-0.5 text-[10.5px] tracking-[0.12em] text-tinta uppercase">
              <span className="size-1.5 rounded-full bg-tinta" /> agora
            </span>
          )}
          {encerrada && <span className="rounded-full border border-suave/40 px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.12em] text-suave uppercase">encerrada</span>}
        </span>
        <span className="mt-1 block text-[clamp(15px,4.1vw,20px)] leading-[1.15] font-extrabold tracking-[-0.015em] [overflow-wrap:anywhere]">{aula.tema}</span>
        <span className="mt-1.5 block text-[14px] leading-tight text-suave">{nomeNaProgramacao(prof)}</span>
      </span>
    </>
  );
  return (
    <li
      data-rev
      style={{ ["--atraso" as string]: `${i * 0.06}s` }}
      className={`cartao flex min-w-0 items-center gap-2 p-2.5 transition-[border-color,box-shadow,opacity] duration-300 ${marcada ? "!border-brasa shadow-[0_0_0_1px_var(--color-brasa),0_14px_36px_-18px_rgb(244_122_18/0.7)]" : ""} ${encerrada ? "opacity-55" : ""}`}
    >
      {temPerfil ? (
        <button type="button" onClick={() => abrir(prof)} aria-label={`${aula.tema}, com ${nomeNaProgramacao(prof)}. Ver perfil.`} className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] sm:gap-3.5">
          {corpo}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5">{corpo}</div>
      )}
      <button
        type="button"
        aria-pressed={marcada}
        aria-label={marcada ? `Tirar ${aula.tema} da minha inscrição` : `Quero assistir ${aula.tema}`}
        onClick={() => {
          lista.alternar(aula.id);
          track("aula_marcar", { aula: aula.id, marcada: !marcada });
        }}
        className={`mr-1 grid size-[46px] shrink-0 sm:size-[52px] place-items-center rounded-full border-[1.5px] transition-[background-color,border-color,color,transform] duration-300 active:scale-90 ${
          marcada ? "border-brasa bg-brasa text-tinta" : "border-brasa/70 text-brasa hover:bg-brasa/15"
        }`}
      >
        {marcada ? <Check className="size-6" strokeWidth={3} aria-hidden /> : <Plus className="size-6" strokeWidth={2.4} aria-hidden />}
      </button>
    </li>
  );
}

/**
 * AULAS-SHOW: as seis aulas à vista, separadas por dia. Cada cartão mostra foto, horário,
 * tema e quem ensina. O botão "+" escolhe a aula para a inscrição; tocar no cartão abre o perfil.
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
      <TituloSecao frase="Bora aprender" titulo="Aulas-show" apoio={inscricaoAtiva ? <>Toque no <strong className="text-ambar">+</strong> para escolher as suas.</> : `${aulas.length} aulas em ${dias.length} dias. ${profissionais.length} profissionais.`} />

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
            <ul className="mx-auto mt-5 grid max-w-[520px] grid-cols-1 gap-3 lg:max-w-none lg:grid-cols-2 lg:gap-4">
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
              {aberto.foto && <img src={aberto.foto} alt={`Foto de ${aberto.nomeCompleto || aberto.nome}`} width={900} height={1200} className="absolute inset-0 size-full object-cover" style={{ objectPosition: aberto.foco }} />}
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
