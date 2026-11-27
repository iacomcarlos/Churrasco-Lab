"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, FileText, ImageIcon, LoaderCircle, Paperclip, X } from "lucide-react";
import { evento } from "@/config/evento";
import { inscricao, inscricaoAtiva, regioes } from "@/config/inscricao";
import { expositores as cfg } from "@/config/expositores";
import { LogoBranca, TituloSecao } from "@/components/Pecas";
import { useRevelar } from "@/lib/revelar";
import { track } from "@/lib/analytics";

type Campo = "empreendimento" | "organizacao" | "regiao" | "tempo" | "responsavel" | "whatsapp" | "email" | "atividades" | "descricao" | "experiencia" | "arquivos" | "link" | "equipe" | "produtos" | "pagamentos" | "sanitario" | "ciencia" | "envio";
type Erros = Partial<Record<Campo, string>>;

const mascara = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const novoId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });
/** Nome de arquivo seguro para o endereço: sem acentos, espaços ou símbolos. */
const nomeSeguro = (nome: string) => {
  const limpo = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^[-.]+/, "");
  const ponto = limpo.lastIndexOf(".");
  const base = (ponto > 0 ? limpo.slice(0, ponto) : limpo).slice(0, 60) || "arquivo";
  const ext = ponto > 0 ? limpo.slice(ponto).slice(0, 8).toLowerCase() : "";
  return `${base}${ext}`;
};
const tamanho = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/* ── peças do formulário ── */
function Bloco({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <fieldset className="cartao px-5 py-6 sm:px-7 sm:py-7">
      <legend className="float-left mb-4 flex w-full items-center gap-2.5 text-[18px] font-extrabold">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brasa text-[14px] text-tinta">{n}</span>
        {titulo}
      </legend>
      <div className="clear-both grid gap-4">{children}</div>
    </fieldset>
  );
}
function Rotulo({ para, children, opcional, ajuda }: { para?: string; children: ReactNode; opcional?: boolean; ajuda?: string }) {
  const corpo = (
    <>
      <span className="text-[14.5px] font-bold">
        {children} {opcional && <span className="font-medium text-suave">(opcional)</span>}
      </span>
      {ajuda && <span className="mt-0.5 block text-[13px] leading-snug text-suave">{ajuda}</span>}
    </>
  );
  return para ? (
    <label htmlFor={para} className="mb-1.5 block">
      {corpo}
    </label>
  ) : (
    <p className="mb-2">{corpo}</p>
  );
}
function Opcoes({ opcoes, marcadas, alternar, invalido }: { opcoes: readonly string[]; marcadas: string[]; alternar: (o: string) => void; invalido?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => {
        const on = marcadas.includes(o);
        return (
          <label
            key={o}
            className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border-[1.5px] px-3.5 py-1.5 text-[14.5px] leading-tight font-bold transition-[background-color,border-color] duration-200 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ambar ${
              on ? "border-brasa bg-brasa/15" : invalido ? "border-[#ff6b57]/70 bg-cartao-2" : "border-[rgb(255_190_130/0.2)] bg-cartao-2"
            }`}
          >
            <input type="checkbox" checked={on} onChange={() => alternar(o)} className="sr-only" />
            <span aria-hidden className={`grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors ${on ? "border-brasa bg-brasa text-tinta" : "border-suave/50"}`}>
              {on && <Check className="size-3.5" strokeWidth={3.5} />}
            </span>
            {o}
          </label>
        );
      })}
    </div>
  );
}
function Seta() {
  return <span aria-hidden className="pointer-events-none absolute top-1/2 right-5 size-2.5 -translate-y-[70%] rotate-45 border-r-2 border-b-2 border-ambar" />;
}

/**
 * CREDENCIAMENTO DE EXPOSITORES: formulário com as informações pedidas nas regras da organização
 * (itens "a" a "l"), em seis blocos curtos. Grava direto no banco do evento; as fotos e o catálogo
 * vão para uma pasta privada, que só a área restrita abre. Sem cadastro e sem senha.
 */
export function Credenciamento() {
  const root = useRef<HTMLDivElement>(null);
  const id = useRef("");
  const inicio = useRef(0);
  const enviados = useRef<Map<File, string>>(new Map());
  const [f, setF] = useState({ empreendimento: "", organizacao: "", regiao: "", endereco: "", tempo: "", responsavel: "", whatsapp: "", email: "", descricao: "", experiencia: "", link: "", equipe: "", produtos: "", necessidadesObs: "", sanitario: "", acessibilidade: "" });
  const [atividades, setAtividades] = useState<string[]>([]);
  const [pagamentos, setPagamentos] = useState<string[]>([]);
  const [necessidades, setNecessidades] = useState<string[]>([]);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [ciencia, setCiencia] = useState(false);
  const [mel, setMel] = useState(""); // campo-isca contra robôs
  const [erros, setErros] = useState<Erros>({});
  const [etapa, setEtapa] = useState("");
  const [feito, setFeito] = useState(false);
  useRevelar(root);

  useEffect(() => {
    id.current = novoId();
    inicio.current = Date.now();
  }, []);

  const limpar = (k: Campo) => setErros((e) => (e[k] || e.envio ? { ...e, [k]: undefined, envio: undefined } : e));
  const campo = (k: keyof typeof f, erro?: Campo) => ({
    value: f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setF((a) => ({ ...a, [k]: e.target.value }));
      if (erro) limpar(erro);
    },
    "aria-invalid": erro ? Boolean(erros[erro]) : undefined,
  });
  const alternar = (lista: string[], set: (v: string[]) => void, erro?: Campo) => (o: string) => {
    set(lista.includes(o) ? lista.filter((x) => x !== o) : [...lista, o]);
    if (erro) limpar(erro);
  };
  const erro = (k: Campo) =>
    erros[k] ? (
      <p role="alert" className="mt-1.5 text-[13.5px] font-semibold text-[#ff8a75]">
        {erros[k]}
      </p>
    ) : null;

  const escolherArquivos = (lista: FileList | null) => {
    if (!lista) return;
    const novos: File[] = [];
    let aviso = "";
    for (const a of Array.from(lista)) {
      if (!(cfg.arquivos.tipos as readonly string[]).includes(a.type)) aviso = "Envie só fotos (JPG, PNG ou WebP) ou PDF.";
      else if (a.size > cfg.arquivos.tamanhoMb * 1048576) aviso = `Cada arquivo pode ter até ${cfg.arquivos.tamanhoMb} MB.`;
      else if (!arquivos.some((x) => x.name === a.name && x.size === a.size)) novos.push(a);
    }
    const todos = [...arquivos, ...novos];
    if (todos.length > cfg.arquivos.maximo) aviso = `Dá para enviar até ${cfg.arquivos.maximo} arquivos.`;
    setArquivos(todos.slice(0, cfg.arquivos.maximo));
    setErros((e) => ({ ...e, arquivos: aviso || undefined }));
  };

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (etapa) return;
    const e: Erros = {};
    const t = (k: keyof typeof f) => f[k].trim();
    if (t("empreendimento").length < 2) e.empreendimento = "Escreva o nome do empreendimento ou do grupo.";
    if (!f.organizacao) e.organizacao = "Escolha a forma de organização.";
    if (!f.regiao) e.regiao = "Escolha a região onde atua.";
    if (!f.tempo) e.tempo = "Escolha há quanto tempo atua.";
    if (t("responsavel").length < 3) e.responsavel = "Escreva o nome do responsável.";
    if (f.whatsapp.replace(/\D/g, "").length < 10) e.whatsapp = "Informe o WhatsApp com DDD.";
    const em = t("email");
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) e.email = "Confira o e-mail.";
    if (!atividades.length) e.atividades = "Marque pelo menos um tipo de atividade.";
    if (t("descricao").length < 10) e.descricao = "Descreva os produtos ou serviços que vai apresentar.";
    if (t("experiencia").length < 5) e.experiencia = "Conte um pouco da sua experiência.";
    const eq = Number(f.equipe);
    if (!Number.isInteger(eq) || eq < 1 || eq > 50) e.equipe = "Informe quantas pessoas vão trabalhar no estande.";
    if (t("produtos").length < 5) e.produtos = "Liste os produtos e os preços previstos.";
    if (!pagamentos.length) e.pagamentos = "Marque pelo menos um meio de pagamento.";
    if (t("sanitario").length < 5) e.sanitario = "Conte como cuida da higiene e quais documentos possui.";
    if (!ciencia) e.ciencia = "É preciso marcar a declaração para enviar.";
    setErros(e);
    const primeiro = Object.keys(e)[0];
    if (primeiro) {
      root.current?.querySelector<HTMLElement>(`[data-campo="${primeiro}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    // robôs preenchem o campo invisível ou enviam em menos de 3 segundos: finge sucesso e não grava nada
    const robo = Boolean(mel) || Date.now() - inicio.current < 3000;
    const cab = { apikey: inscricao.chave, Authorization: `Bearer ${inscricao.chave}` };
    try {
      const caminhos: string[] = [];
      if (!robo) {
        for (let i = 0; i < arquivos.length; i++) {
          const a = arquivos[i];
          setEtapa(`Enviando arquivo ${i + 1} de ${arquivos.length}...`);
          let caminho = enviados.current.get(a);
          if (!caminho) {
            caminho = `${id.current}/${i + 1}-${nomeSeguro(a.name)}`;
            const r = await fetch(`${inscricao.url}/storage/v1/object/${cfg.bucket}/${caminho}`, { method: "POST", headers: { ...cab, "Content-Type": a.type, "x-upsert": "false" }, body: a });
            if (!r.ok) throw new Error("arquivo");
            enviados.current.set(a, caminho);
          }
          caminhos.push(caminho);
        }
        setEtapa("Enviando o credenciamento...");
        const r = await fetch(`${inscricao.url}/rest/v1/${cfg.tabela}`, {
          method: "POST",
          headers: { ...cab, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({
            id: id.current,
            empreendimento: t("empreendimento").replace(/\s+/g, " ").slice(0, 160),
            responsavel: t("responsavel").replace(/\s+/g, " ").slice(0, 120),
            whatsapp: f.whatsapp.replace(/\D/g, ""),
            email: em.toLowerCase().slice(0, 160) || null,
            regiao: f.regiao,
            endereco: t("endereco").slice(0, 240) || null,
            organizacao: f.organizacao,
            atividades,
            descricao: t("descricao").slice(0, 2000),
            arquivos: caminhos,
            link: t("link").slice(0, 300) || null,
            tempo_atuacao: f.tempo,
            experiencia: t("experiencia").slice(0, 2000),
            equipe: eq,
            produtos_precos: t("produtos").slice(0, 2000),
            pagamentos,
            necessidades,
            necessidades_obs: t("necessidadesObs").slice(0, 1000) || null,
            sanitario: t("sanitario").slice(0, 2000),
            acessibilidade: t("acessibilidade").slice(0, 1000) || null,
            ciencia: true,
            consentimento: true,
          }),
        });
        if (!r.ok) throw new Error((await r.text().catch(() => "")).includes("limite") ? "limite" : "envio");
      }
      setFeito(true);
      track("expositor_enviado", { arquivos: arquivos.length });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (x) {
      const m = (x as Error).message;
      setErros({
        envio:
          m === "limite"
            ? "Este WhatsApp já enviou o número máximo de pedidos. Fale com a organização para corrigir um envio."
            : m === "arquivo"
              ? "Não deu para enviar um dos arquivos. Confira a internet e tente de novo, ou envie sem ele."
              : "Não deu para enviar. Confira sua internet e tente de novo.",
      });
      track("expositor_erro", { tipo: m });
    } finally {
      setEtapa("");
    }
  };

  const reiniciar = () => {
    id.current = novoId();
    inicio.current = Date.now();
    enviados.current = new Map();
    setF((a) => ({ ...a, empreendimento: "", descricao: "", experiencia: "", link: "", equipe: "", produtos: "", necessidadesObs: "", sanitario: "", acessibilidade: "" }));
    setAtividades([]);
    setArquivos([]);
    setCiencia(false);
    setFeito(false);
  };

  return (
    <div ref={root} className="relative min-h-[100svh] overflow-hidden bg-fundo">
      <div aria-hidden className="pointer-events-none absolute top-[-10%] left-1/2 size-[min(150vw,900px)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(196_62_12/0.22),transparent)]" />
      <header className="relative mx-auto flex h-[68px] max-w-[1120px] items-center justify-between px-4 sm:px-6">
        <a href="/" aria-label={`${evento.nome}, página inicial`}>
          <LogoBranca className="h-[44px] w-auto" />
        </a>
        <a href="/" className="btn btn-linha btn-sm !min-h-[42px]">
          <ArrowLeft className="size-4" strokeWidth={2.6} aria-hidden /> Voltar ao site
        </a>
      </header>

      <main className="relative px-4 pt-8 pb-20 sm:px-5 sm:pt-12">
        <TituloSecao frase="Venha expor" titulo={cfg.titulo} apoio={feito ? undefined : cfg.chamada} />
        <p data-rev className="espacado mt-4 text-center text-[12.5px] font-bold text-ambar">
          {evento.datasTexto} · {evento.local.nome} · {evento.local.bairro}
        </p>

        {!inscricaoAtiva ? (
          <p className="mx-auto mt-10 max-w-[560px] text-center text-suave">O credenciamento pelo site não está disponível no momento.</p>
        ) : feito ? (
          <div role="status" className="cartao mx-auto mt-10 max-w-[540px] px-6 py-9 text-center [animation:surge_0.6s_var(--ease-expo)_both] sm:px-9">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-brasa text-tinta" style={{ animation: "pulso 1.8s ease-out 2" }}>
              <Check className="size-8" strokeWidth={3} aria-hidden />
            </span>
            <h2 className="titulo mt-5 text-[clamp(24px,7vw,32px)]">Pedido enviado!</h2>
            <p className="mt-2.5 text-[16px] text-suave">{cfg.sucesso}</p>
            <a href="/" className="btn btn-brasa mt-7 w-full">
              Voltar ao site <ArrowRight className="size-5" strokeWidth={2.8} aria-hidden />
            </a>
            <button type="button" onClick={reiniciar} className="mt-5 text-[14px] font-semibold text-suave underline underline-offset-4">
              Credenciar outro empreendimento
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} noValidate className="mx-auto mt-9 grid max-w-[680px] gap-4 [animation:surge_0.6s_var(--ease-expo)_both]">
            <div className="rounded-[20px] border border-brasa/40 bg-brasa/10 px-5 py-4">
              <p className="text-[13px] font-bold tracking-[0.14em] text-ambar uppercase">Quem pode participar</p>
              <p className="mt-1.5 text-[14.5px] leading-[1.55] text-texto/90">{cfg.admitidas}</p>
            </div>

            <Bloco n={1} titulo="O empreendimento">
              <div data-campo="empreendimento">
                <Rotulo para="x-emp">Nome do empreendimento, nome comercial ou do grupo</Rotulo>
                <input id="x-emp" className="campo" maxLength={160} autoCapitalize="words" {...campo("empreendimento", "empreendimento")} />
                {erro("empreendimento")}
              </div>
              <div data-campo="organizacao">
                <Rotulo para="x-org">Forma de organização</Rotulo>
                <div className="relative">
                  <select id="x-org" className={`campo pr-11 ${f.organizacao ? "" : "!font-medium !text-[#94867a]"}`} {...campo("organizacao", "organizacao")}>
                    <option value="">Escolha</option>
                    {cfg.organizacoes.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <Seta />
                </div>
                {erro("organizacao")}
              </div>
              <div data-campo="regiao">
                <Rotulo para="x-reg">Região Administrativa onde atua</Rotulo>
                <div className="relative">
                  <select id="x-reg" className={`campo pr-11 ${f.regiao ? "" : "!font-medium !text-[#94867a]"}`} {...campo("regiao", "regiao")}>
                    <option value="">Escolha</option>
                    {regioes.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <Seta />
                </div>
                {erro("regiao")}
              </div>
              <div>
                <Rotulo para="x-end" opcional>Endereço do empreendimento</Rotulo>
                <input id="x-end" className="campo" maxLength={240} autoComplete="street-address" {...campo("endereco")} />
              </div>
              <div data-campo="tempo">
                <Rotulo para="x-tempo">Há quanto tempo atua</Rotulo>
                <div className="relative">
                  <select id="x-tempo" className={`campo pr-11 ${f.tempo ? "" : "!font-medium !text-[#94867a]"}`} {...campo("tempo", "tempo")}>
                    <option value="">Escolha</option>
                    {cfg.tempos.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <Seta />
                </div>
                {erro("tempo")}
              </div>
            </Bloco>

            <Bloco n={2} titulo="Responsável">
              <div data-campo="responsavel">
                <Rotulo para="x-resp">Nome do representante responsável</Rotulo>
                <input id="x-resp" className="campo" maxLength={120} autoComplete="name" autoCapitalize="words" {...campo("responsavel", "responsavel")} />
                {erro("responsavel")}
              </div>
              <div data-campo="whatsapp">
                <Rotulo para="x-whats">WhatsApp com DDD</Rotulo>
                <input
                  id="x-whats"
                  className="campo"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={f.whatsapp}
                  onChange={(e) => {
                    setF((a) => ({ ...a, whatsapp: mascara(e.target.value) }));
                    limpar("whatsapp");
                  }}
                  aria-invalid={Boolean(erros.whatsapp)}
                />
                {erro("whatsapp")}
              </div>
              <div data-campo="email">
                <Rotulo para="x-email" opcional>E-mail</Rotulo>
                <input id="x-email" className="campo" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" maxLength={160} {...campo("email", "email")} />
                {erro("email")}
              </div>
            </Bloco>

            <Bloco n={3} titulo="O que você vai apresentar">
              <div data-campo="atividades">
                <Rotulo ajuda="Marque todos os que se aplicam.">Tipo de atividade</Rotulo>
                <Opcoes opcoes={cfg.atividades} marcadas={atividades} alternar={alternar(atividades, setAtividades, "atividades")} invalido={Boolean(erros.atividades)} />
                {erro("atividades")}
              </div>
              <div data-campo="descricao">
                <Rotulo para="x-desc">Produtos ou serviços que pretende apresentar</Rotulo>
                <textarea id="x-desc" className="campo min-h-[120px] resize-y" maxLength={2000} {...campo("descricao", "descricao")} />
                {erro("descricao")}
              </div>
              <div data-campo="experiencia">
                <Rotulo para="x-exp" ajuda="Eventos, feiras e trabalhos de que já participou.">Experiência no segmento</Rotulo>
                <textarea id="x-exp" className="campo min-h-[100px] resize-y" maxLength={2000} {...campo("experiencia", "experiencia")} />
                {erro("experiencia")}
              </div>
              <div data-campo="arquivos">
                <Rotulo opcional ajuda={`Até ${cfg.arquivos.maximo} arquivos, em foto ou PDF, com no máximo ${cfg.arquivos.tamanhoMb} MB cada.`}>
                  Fotos, catálogo ou portfólio
                </Rotulo>
                {arquivos.length > 0 && (
                  <ul className="mb-2.5 grid gap-2">
                    {arquivos.map((a) => (
                      <li key={`${a.name}-${a.size}`} className="flex items-center gap-3 rounded-2xl bg-cartao-2 px-3.5 py-2.5">
                        {a.type === "application/pdf" ? <FileText className="size-5 shrink-0 text-brasa" aria-hidden /> : <ImageIcon className="size-5 shrink-0 text-brasa" aria-hidden />}
                        <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">{a.name}</span>
                        <span className="shrink-0 text-[12.5px] text-suave">{tamanho(a.size)}</span>
                        <button type="button" onClick={() => setArquivos((l) => l.filter((x) => x !== a))} aria-label={`Tirar ${a.name}`} className="grid size-9 shrink-0 place-items-center rounded-full text-suave hover:text-texto">
                          <X className="size-[18px]" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {arquivos.length < cfg.arquivos.maximo && (
                  <label className="btn btn-linha btn-sm w-full cursor-pointer has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ambar">
                    <Paperclip className="size-4" aria-hidden /> {arquivos.length ? "Adicionar mais arquivos" : "Escolher arquivos"}
                    <input
                      type="file"
                      multiple
                      accept={cfg.arquivos.aceitar}
                      className="sr-only"
                      onChange={(e) => {
                        escolherArquivos(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
                {erro("arquivos")}
              </div>
              <div data-campo="link">
                <Rotulo para="x-link" opcional>Instagram, site ou link do catálogo</Rotulo>
                <input id="x-link" className="campo" inputMode="url" autoCapitalize="none" maxLength={300} placeholder="@seuperfil ou endereço do site" {...campo("link", "link")} />
              </div>
            </Bloco>

            <Bloco n={4} titulo="Planejamento da participação">
              <div data-campo="equipe">
                <Rotulo para="x-eq">Quantas pessoas vão trabalhar no estande</Rotulo>
                <input id="x-eq" className="campo" inputMode="numeric" maxLength={2} value={f.equipe} onChange={(e) => { setF((a) => ({ ...a, equipe: e.target.value.replace(/\D/g, "").slice(0, 2) })); limpar("equipe"); }} aria-invalid={Boolean(erros.equipe)} />
                {erro("equipe")}
              </div>
              <div data-campo="produtos">
                <Rotulo para="x-prod" ajuda="Exemplo: Costela defumada (porção): R$ 35.">Produtos e preços previstos</Rotulo>
                <textarea id="x-prod" className="campo min-h-[110px] resize-y" maxLength={2000} {...campo("produtos", "produtos")} />
                {erro("produtos")}
              </div>
              <div data-campo="pagamentos">
                <Rotulo>Meios de pagamento que vai aceitar</Rotulo>
                <Opcoes opcoes={cfg.pagamentos} marcadas={pagamentos} alternar={alternar(pagamentos, setPagamentos, "pagamentos")} invalido={Boolean(erros.pagamentos)} />
                {erro("pagamentos")}
              </div>
            </Bloco>

            <Bloco n={5} titulo="Estrutura e cuidados">
              <div>
                <Rotulo opcional ajuda="Marque o que o seu estande precisa.">Necessidades operacionais</Rotulo>
                <Opcoes opcoes={cfg.necessidades} marcadas={necessidades} alternar={alternar(necessidades, setNecessidades)} />
              </div>
              <div>
                <Rotulo para="x-nec" opcional ajuda="Voltagem, equipamentos que vai ligar, uso de água, espaço para guardar produtos.">Detalhes das necessidades</Rotulo>
                <textarea id="x-nec" className="campo min-h-[90px] resize-y" maxLength={1000} {...campo("necessidadesObs")} />
              </div>
              <div data-campo="sanitario">
                <Rotulo para="x-san" ajuda="Como cuida da higiene e da conservação dos produtos e quais documentos possui para a atividade.">Condições sanitárias e documentação</Rotulo>
                <textarea id="x-san" className="campo min-h-[110px] resize-y" maxLength={2000} {...campo("sanitario", "sanitario")} />
                {erro("sanitario")}
              </div>
              <div>
                <Rotulo para="x-ace" opcional ajuda="Se alguém da equipe precisa de alguma adaptação, conte aqui.">Necessidades de acessibilidade</Rotulo>
                <textarea id="x-ace" className="campo min-h-[90px] resize-y" maxLength={1000} {...campo("acessibilidade")} />
              </div>
            </Bloco>

            <fieldset data-campo="ciencia" className="cartao px-5 py-6 sm:px-7">
              <legend className="sr-only">Declaração</legend>
              <label className="flex cursor-pointer items-start gap-3.5 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ambar">
                <input
                  type="checkbox"
                  checked={ciencia}
                  onChange={(e) => {
                    setCiencia(e.target.checked);
                    limpar("ciencia");
                  }}
                  className="sr-only"
                />
                <span aria-hidden className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-[9px] border-[1.5px] transition-colors ${ciencia ? "border-brasa bg-brasa text-tinta" : erros.ciencia ? "border-[#ff6b57]" : "border-suave/60"}`}>
                  {ciencia && <Check className="size-5" strokeWidth={3.5} />}
                </span>
                <span className="text-[15px] leading-[1.5] font-semibold">{cfg.declaracao}</span>
              </label>
              {erro("ciencia")}

              {/* campo-isca: invisível para pessoas */}
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Site
                  <input tabIndex={-1} autoComplete="off" value={mel} onChange={(e) => setMel(e.target.value)} />
                </label>
              </div>

              <button type="submit" disabled={Boolean(etapa)} className="btn btn-brasa mt-6 w-full !min-h-[62px] !px-4 !text-[clamp(15px,4.2vw,17px)] disabled:opacity-80">
                {etapa && <LoaderCircle className="size-5 shrink-0 animate-spin" aria-hidden />}
                {etapa || "Enviar credenciamento"}
                {!etapa && <ArrowRight className="size-5" strokeWidth={2.8} aria-hidden />}
              </button>
              <div data-campo="envio" className="text-center">{erro("envio")}</div>
              <p className="mt-4 text-center text-[12.5px] leading-snug text-suave">{cfg.privacidade}</p>
            </fieldset>
          </form>
        )}
      </main>
    </div>
  );
}
