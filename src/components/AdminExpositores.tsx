"use client";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, FileDown, FileSpreadsheet, FileText, LoaderCircle, Paperclip, RefreshCw, Search } from "lucide-react";
import { inscricao } from "@/config/inscricao";
import { expositores as cfg } from "@/config/expositores";
import { exportarCsv, exportarExcel, type Tabela } from "@/lib/exportar";

type Expositor = {
  id: string;
  criado_em: string;
  empreendimento: string;
  responsavel: string;
  whatsapp: string;
  email: string | null;
  regiao: string;
  endereco: string | null;
  organizacao: string;
  atividades: string[];
  descricao: string;
  arquivos: string[];
  link: string | null;
  tempo_atuacao: string;
  experiencia: string;
  equipe: number;
  produtos_precos: string;
  pagamentos: string[];
  necessidades: string[];
  necessidades_obs: string | null;
  sanitario: string;
  acessibilidade: string | null;
};

const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const fone = (d: string) => (d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : d);
const nomeArquivo = (c: string) => c.split("/").pop() ?? c;

/**
 * Pedidos de credenciamento dos expositores, na área restrita.
 * Usa o mesmo login e senha dos inscritos. Os arquivos ficam numa pasta privada: cada clique em
 * um arquivo pede ao servidor um link que vale 10 minutos.
 */
export function AdminExpositores({ login, senha }: { login: string; senha: string }) {
  const [lista, setLista] = useState<Expositor[] | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);
  const [abrindo, setAbrindo] = useState("");
  const [atualizado, setAtualizado] = useState("");

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const r = await fetch(`${inscricao.url}/rest/v1/rpc/churrascolab_admin_expositores`, {
        method: "POST",
        headers: { apikey: inscricao.chave, Authorization: `Bearer ${inscricao.chave}`, "Content-Type": "application/json" },
        body: JSON.stringify({ p_login: login, p_senha: senha }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const j = (await r.json()) as { erro?: string; expositores?: Expositor[] };
      if (j.erro) setErro(j.erro === "bloqueado" ? "Muitas tentativas erradas. Aguarde 15 minutos e tente de novo." : "Sessão expirada. Saia e entre de novo.");
      else {
        setLista(j.expositores ?? []);
        setAtualizado(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      }
    } catch {
      setErro("Não foi possível conectar. Confira a internet e tente de novo.");
    } finally {
      setCarregando(false);
    }
  }, [login, senha]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  const abrirArquivo = async (caminho: string) => {
    if (abrindo) return;
    setAbrindo(caminho);
    setErro("");
    // a janela é aberta já no clique, para o navegador não bloquear como pop-up
    const janela = window.open("", "_blank");
    try {
      const r = await fetch(`${inscricao.url}/functions/v1/${cfg.funcaoArquivo}`, {
        method: "POST",
        headers: { apikey: inscricao.chave, "Content-Type": "application/json" },
        body: JSON.stringify({ login, senha, caminho }),
      });
      const j = (await r.json()) as { url?: string };
      if (!r.ok || !j.url) throw new Error();
      if (janela) janela.location.href = j.url;
      else window.location.href = j.url;
    } catch {
      janela?.close();
      setErro("Não foi possível abrir o arquivo. Tente de novo.");
    } finally {
      setAbrindo("");
    }
  };

  const visiveis = useMemo(() => {
    if (!lista) return [];
    const q = busca.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((e) => [e.empreendimento, e.responsavel, e.whatsapp, e.email ?? "", e.regiao, e.organizacao, e.atividades.join(" ")].some((v) => v.toLowerCase().includes(q)));
  }, [lista, busca]);

  const tabela = (): Tabela => ({
    cabecalho: ["Data e hora", "Empreendimento", "Forma de organização", "Região", "Endereço", "Tempo de atuação", "Responsável", "WhatsApp", "E-mail", "Atividades", "Produtos ou serviços", "Experiência", "Link", "Arquivos", "Equipe", "Produtos e preços", "Meios de pagamento", "Necessidades", "Detalhes das necessidades", "Condições sanitárias e documentação", "Acessibilidade"],
    linhas: visiveis.map((e) => [
      quando(e.criado_em), e.empreendimento, e.organizacao, e.regiao, e.endereco ?? "", e.tempo_atuacao, e.responsavel, fone(e.whatsapp), e.email ?? "", e.atividades.join(", "), e.descricao, e.experiencia, e.link ?? "",
      String(e.arquivos.length), String(e.equipe), e.produtos_precos, e.pagamentos.join(", "), e.necessidades.join(", "), e.necessidades_obs ?? "", e.sanitario, e.acessibilidade ?? "",
    ]),
  });
  const arquivo = `expositores-churrasco-lab-${new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })}`;

  if (!lista)
    return (
      <p className="mt-10 flex items-center justify-center gap-2 text-suave">
        {erro || (
          <>
            <LoaderCircle className="size-5 animate-spin" aria-hidden /> Carregando os expositores...
          </>
        )}
      </p>
    );

  const Item = ({ t, children }: { t: string; children: React.ReactNode }) => (
    <div>
      <dt className="text-[11.5px] font-bold tracking-[0.1em] text-suave uppercase">{t}</dt>
      <dd className="mt-0.5 text-[14px] leading-[1.5] whitespace-pre-line">{children || "—"}</dd>
    </div>
  );

  return (
    <>
      <div className="mt-6 flex flex-wrap items-stretch gap-2.5">
        <div className="cartao px-4 py-4">
          <p className="titulo text-[38px] text-ambar">{lista.length}</p>
          <p className="mt-1 text-[13px] font-semibold text-suave">{lista.length === 1 ? "pedido de credenciamento" : "pedidos de credenciamento"}</p>
        </div>
        <p className="nao-imprime self-end pb-1 text-[13px] text-suave">Atualizado às {atualizado}</p>
      </div>

      <div className="nao-imprime mt-5 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-suave" aria-hidden />
          <input className="campo !min-h-[48px] !pl-11" placeholder="Buscar por empreendimento, responsável, WhatsApp, região ou atividade" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar expositores" />
        </div>
        <button type="button" onClick={buscar} disabled={carregando} className="btn btn-linha btn-sm">
          <RefreshCw className={`size-4 ${carregando ? "animate-spin" : ""}`} aria-hidden /> Atualizar
        </button>
        <button type="button" onClick={() => exportarExcel(tabela(), arquivo)} disabled={!visiveis.length} className="btn btn-brasa btn-sm disabled:opacity-50">
          <FileSpreadsheet className="size-4" aria-hidden /> Excel
        </button>
        <button type="button" onClick={() => exportarCsv(tabela(), arquivo)} disabled={!visiveis.length} className="btn btn-linha btn-sm disabled:opacity-50">
          <FileDown className="size-4" aria-hidden /> CSV
        </button>
        <button type="button" onClick={() => window.print()} disabled={!visiveis.length} className="btn btn-linha btn-sm disabled:opacity-50">
          <FileText className="size-4" aria-hidden /> PDF
        </button>
      </div>
      {erro && (
        <p role="alert" className="mt-3 text-[14px] font-semibold text-[#ff8a75]">
          {erro}
        </p>
      )}
      <p className="mt-3 text-[13px] text-suave">
        Mostrando {visiveis.length} de {lista.length}
        {busca ? ` · busca: "${busca}"` : ""}
      </p>

      <div className="cartao mt-3 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-[14px]">
          <thead>
            <tr className="border-b border-[rgb(255_190_130/0.18)] text-[12px] tracking-[0.1em] text-suave uppercase">
              {["Data e hora", "Empreendimento", "Responsável", "WhatsApp", "Região", "Atividades", ""].map((h, i) => (
                <th key={i} className="px-4 py-3 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((e) => {
              const on = aberto === e.id;
              return (
                <Fragment key={e.id}>
                  <tr className={`align-top ${on ? "" : "border-b border-[rgb(255_190_130/0.08)]"}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-suave">{quando(e.criado_em)}</td>
                    <td className="px-4 py-3 font-bold">
                      {e.empreendimento}
                      <span className="block text-[12.5px] font-medium text-suave">{e.organizacao}</span>
                    </td>
                    <td className="px-4 py-3">{e.responsavel}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a href={`https://wa.me/55${e.whatsapp}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-ambar underline underline-offset-2">
                        {fone(e.whatsapp)}
                      </a>
                    </td>
                    <td className="px-4 py-3">{e.regiao}</td>
                    <td className="px-4 py-3">{e.atividades.join(", ")}</td>
                    <td className="nao-imprime px-4 py-3 text-right">
                      <button type="button" onClick={() => setAberto(on ? null : e.id)} aria-expanded={on} className="inline-flex items-center gap-1 rounded-full border border-brasa/70 px-3 py-1.5 text-[13px] font-bold whitespace-nowrap text-ambar">
                        {on ? "Fechar" : "Ver ficha"} <ChevronDown className={`size-4 transition-transform ${on ? "rotate-180" : ""}`} aria-hidden />
                      </button>
                    </td>
                  </tr>
                  {on && (
                    <tr className="border-b border-[rgb(255_190_130/0.08)]">
                      <td colSpan={7} className="px-4 pt-1 pb-6">
                        <dl className="grid gap-x-8 gap-y-4 rounded-2xl bg-cartao-2 p-5 sm:grid-cols-2">
                          <Item t="Tempo de atuação">{e.tempo_atuacao}</Item>
                          <Item t="Endereço">{e.endereco}</Item>
                          <Item t="E-mail">{e.email}</Item>
                          <Item t="Instagram, site ou catálogo">{e.link}</Item>
                          <Item t="Produtos ou serviços">{e.descricao}</Item>
                          <Item t="Experiência no segmento">{e.experiencia}</Item>
                          <Item t="Equipe no estande">{`${e.equipe} ${e.equipe === 1 ? "pessoa" : "pessoas"}`}</Item>
                          <Item t="Meios de pagamento">{e.pagamentos.join(", ")}</Item>
                          <Item t="Produtos e preços previstos">{e.produtos_precos}</Item>
                          <Item t="Necessidades operacionais">{[e.necessidades.join(", "), e.necessidades_obs].filter(Boolean).join("\n")}</Item>
                          <Item t="Condições sanitárias e documentação">{e.sanitario}</Item>
                          <Item t="Acessibilidade">{e.acessibilidade}</Item>
                          <div className="sm:col-span-2">
                            <dt className="text-[11.5px] font-bold tracking-[0.1em] text-suave uppercase">Fotos, catálogo ou portfólio</dt>
                            <dd className="mt-1.5 flex flex-wrap gap-2">
                              {e.arquivos.length === 0 && <span className="text-[14px]">Nenhum arquivo enviado.</span>}
                              {e.arquivos.map((c) => (
                                <button key={c} type="button" onClick={() => abrirArquivo(c)} disabled={Boolean(abrindo)} className="inline-flex max-w-full items-center gap-2 rounded-full border border-brasa/70 px-3.5 py-2 text-[13.5px] font-bold text-ambar disabled:opacity-60">
                                  {abrindo === c ? <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden /> : <Paperclip className="size-4 shrink-0" aria-hidden />}
                                  <span className="truncate">{nomeArquivo(c)}</span>
                                </button>
                              ))}
                            </dd>
                          </div>
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!visiveis.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-suave">
                  {lista.length ? "Nenhum expositor com essa busca." : "Ainda não há pedidos de credenciamento."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="nao-imprime mt-4 text-[12.5px] text-suave">
        “Ver ficha” mostra todas as respostas e os arquivos. O Excel e o CSV levam todas as respostas de quem está na tela. O botão PDF abre a impressão do aparelho: escolha “Salvar como PDF”.
      </p>
    </>
  );
}
