"use client";
import { useMemo, useState } from "react";
import { FileDown, FileSpreadsheet, FileText, LoaderCircle, LogOut, RefreshCw, Search } from "lucide-react";
import { aulas, evento } from "@/config/evento";
import { inscricao } from "@/config/inscricao";
import { LogoBranca } from "@/components/Pecas";
import { exportarCsv, exportarExcel, type Tabela } from "@/lib/exportar";

type Lead = { criado_em: string; nome: string; whatsapp: string; email: string | null; cidade: string; aulas: string[] };

const tema = (id: string) => aulas.find((a) => a.id === id)?.tema ?? id;
const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const fone = (d: string) => (d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : d);

/**
 * Área restrita da organização: lista de inscritos, com busca e exportação.
 * O login e a senha são conferidos no banco (a senha fica lá só como hash). Sem acertar os dois,
 * nenhum dado de inscrito chega ao navegador. A senha não é guardada no aparelho: ao recarregar
 * a página, é preciso entrar de novo.
 */
export function Admin() {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("");
  const [atualizado, setAtualizado] = useState("");

  const buscar = async () => {
    setCarregando(true);
    setErro("");
    try {
      const r = await fetch(`${inscricao.url}/rest/v1/rpc/churrascolab_admin_leads`, {
        method: "POST",
        headers: { apikey: inscricao.chave, Authorization: `Bearer ${inscricao.chave}`, "Content-Type": "application/json" },
        body: JSON.stringify({ p_login: login, p_senha: senha }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const j = (await r.json()) as { erro?: string; inscritos?: Lead[] };
      if (j.erro === "bloqueado") setErro("Muitas tentativas erradas. Aguarde 15 minutos e tente de novo.");
      else if (j.erro) setErro("Login ou senha incorretos.");
      else {
        setLeads(j.inscritos ?? []);
        setAtualizado(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      }
    } catch {
      setErro("Não foi possível conectar. Confira a internet e tente de novo.");
    } finally {
      setCarregando(false);
    }
  };

  const visiveis = useMemo(() => {
    if (!leads) return [];
    const q = busca.trim().toLowerCase();
    return leads.filter((l) => (!filtro || l.aulas.includes(filtro)) && (!q || [l.nome, l.whatsapp, l.email ?? "", l.cidade].some((v) => v.toLowerCase().includes(q))));
  }, [leads, busca, filtro]);

  const porAula = useMemo(() => aulas.map((a) => ({ ...a, total: new Set((leads ?? []).filter((l) => l.aulas.includes(a.id)).map((l) => l.whatsapp)).size })), [leads]);
  const pessoas = useMemo(() => new Set((leads ?? []).map((l) => l.whatsapp)).size, [leads]);

  const tabela = (): Tabela => ({
    cabecalho: ["Data e hora", "Nome", "WhatsApp", "E-mail", "Cidade", "Aulas", "Qtd. de aulas"],
    linhas: visiveis.map((l) => [quando(l.criado_em), l.nome, fone(l.whatsapp), l.email ?? "", l.cidade, l.aulas.map(tema).join(", "), String(l.aulas.length)]),
  });
  const nomeArquivo = `inscritos-churrasco-lab-${new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })}`;

  if (!leads) {
    return (
      <main className="grid min-h-[100svh] place-items-center bg-fundo px-5 py-12">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!carregando) buscar();
          }}
          className="cartao w-full max-w-[400px] px-6 py-9 text-center"
        >
          <LogoBranca className="mx-auto h-[70px] w-auto" />
          <h1 className="titulo mt-6 text-[26px]">Inscritos</h1>
          <p className="mt-2 text-[14.5px] text-suave">Área restrita da organização.</p>
          <div className="mt-6 grid gap-3 text-left">
            <label className="sr-only" htmlFor="a-login">Login</label>
            <input id="a-login" className="campo" autoComplete="username" autoCapitalize="none" placeholder="Login" value={login} onChange={(e) => setLogin(e.target.value)} />
            <label className="sr-only" htmlFor="a-senha">Senha</label>
            <input id="a-senha" className="campo" type="password" autoComplete="current-password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          {erro && (
            <p role="alert" className="mt-3 text-[14px] font-semibold text-[#ff8a75]">
              {erro}
            </p>
          )}
          <button type="submit" disabled={carregando || !login || !senha} className="btn btn-brasa mt-5 w-full disabled:opacity-60">
            {carregando && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="admin min-h-[100svh] bg-fundo px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-[1200px]">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <LogoBranca className="nao-imprime h-[52px] w-auto" />
            <div>
              <h1 className="titulo text-[clamp(22px,5.5vw,30px)]">Inscritos</h1>
              <p className="text-[13.5px] text-suave">
                {evento.nome} · atualizado às {atualizado}
              </p>
            </div>
          </div>
          <div className="nao-imprime flex gap-2">
            <button type="button" onClick={buscar} disabled={carregando} className="btn btn-linha btn-sm">
              <RefreshCw className={`size-4 ${carregando ? "animate-spin" : ""}`} aria-hidden /> Atualizar
            </button>
            <button
              type="button"
              onClick={() => {
                setLeads(null);
                setSenha("");
              }}
              className="btn btn-linha btn-sm"
            >
              <LogOut className="size-4" aria-hidden /> Sair
            </button>
          </div>
        </header>

        {/* resumo */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
          <div className="cartao col-span-2 px-4 py-4">
            <p className="titulo text-[38px] text-ambar">{pessoas}</p>
            <p className="mt-1 text-[13px] font-semibold text-suave">{pessoas === 1 ? "pessoa inscrita" : "pessoas inscritas"} ({leads.length} envios)</p>
          </div>
          {porAula.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setFiltro(filtro === a.id ? "" : a.id)}
              aria-pressed={filtro === a.id}
              className={`cartao px-3 py-3 text-left transition-colors ${filtro === a.id ? "!border-brasa !bg-brasa/15" : ""}`}
            >
              <p className="titulo text-[26px]">{a.total}</p>
              <p className="mt-1 text-[12px] leading-tight font-semibold text-suave">{a.tema}</p>
            </button>
          ))}
        </div>

        {/* busca e exportação */}
        <div className="nao-imprime mt-5 flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-suave" aria-hidden />
            <input className="campo !min-h-[48px] !pl-11" placeholder="Buscar por nome, WhatsApp, e-mail ou cidade" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar inscritos" />
          </div>
          <button type="button" onClick={() => exportarExcel(tabela(), nomeArquivo)} disabled={!visiveis.length} className="btn btn-brasa btn-sm disabled:opacity-50">
            <FileSpreadsheet className="size-4" aria-hidden /> Excel
          </button>
          <button type="button" onClick={() => exportarCsv(tabela(), nomeArquivo)} disabled={!visiveis.length} className="btn btn-linha btn-sm disabled:opacity-50">
            <FileDown className="size-4" aria-hidden /> CSV
          </button>
          <button type="button" onClick={() => window.print()} disabled={!visiveis.length} className="btn btn-linha btn-sm disabled:opacity-50">
            <FileText className="size-4" aria-hidden /> PDF
          </button>
        </div>
        <p className="mt-3 text-[13px] text-suave">
          Mostrando {visiveis.length} de {leads.length}
          {filtro ? ` · aula: ${tema(filtro)}` : ""}
          {busca ? ` · busca: "${busca}"` : ""}
        </p>

        {/* lista */}
        <div className="cartao mt-3 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-[rgb(255_190_130/0.18)] text-[12px] tracking-[0.1em] text-suave uppercase">
                {["Data e hora", "Nome", "WhatsApp", "E-mail", "Cidade", "Aulas"].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiveis.map((l, i) => (
                <tr key={`${l.criado_em}-${i}`} className="border-b border-[rgb(255_190_130/0.08)] align-top last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-suave">{quando(l.criado_em)}</td>
                  <td className="px-4 py-3 font-bold">{l.nome}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a href={`https://wa.me/55${l.whatsapp}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-ambar underline underline-offset-2">
                      {fone(l.whatsapp)}
                    </a>
                  </td>
                  <td className="px-4 py-3 break-all">{l.email ?? ""}</td>
                  <td className="px-4 py-3">{l.cidade}</td>
                  <td className="px-4 py-3">{l.aulas.map(tema).join(", ")}</td>
                </tr>
              ))}
              {!visiveis.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-suave">
                    {leads.length ? "Nenhum inscrito com esse filtro." : "Ainda não há inscrições."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="nao-imprime mt-4 text-[12.5px] text-suave">
          O botão PDF abre a impressão do aparelho: escolha “Salvar como PDF”. As exportações levam o que está na tela (respeitam a busca e o filtro de aula).
        </p>
      </div>
    </main>
  );
}
