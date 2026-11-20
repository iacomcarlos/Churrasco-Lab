/**
 * Exportação da lista de inscritos, feita no próprio navegador (nada passa por outro servidor).
 *   CSV   → separado por ponto e vírgula, com acentos corretos no Excel brasileiro
 *   Excel → arquivo .xlsx de verdade, montado aqui mesmo (sem biblioteca externa)
 *   PDF   → pela impressão do navegador ("Salvar como PDF"), com folha limpa em paisagem
 */

export type Tabela = { cabecalho: string[]; linhas: string[][] };

function baixar(conteudo: BlobPart, tipo: string, nome: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function exportarCsv(t: Tabela, nome: string) {
  const cel = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const texto = [t.cabecalho, ...t.linhas].map((l) => l.map(cel).join(";")).join("\r\n");
  baixar("﻿" + texto, "text/csv;charset=utf-8", `${nome}.csv`);
}

/* ── .xlsx mínimo: um ZIP (sem compressão) com as 5 partes obrigatórias ── */
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(b: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function zip(arquivos: { nome: string; dados: Uint8Array }[]) {
  const enc = new TextEncoder();
  const partes: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let pos = 0;
  for (const f of arquivos) {
    const nome = enc.encode(f.nome);
    const crc = crc32(f.dados);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // nomes em UTF-8
    local.setUint16(8, 0, true); // sem compressão
    local.setUint32(10, 0x00210000, true); // hora/data fixas (01/01/1980)
    local.setUint32(14, crc, true);
    local.setUint32(18, f.dados.length, true);
    local.setUint32(22, f.dados.length, true);
    local.setUint16(26, nome.length, true);
    local.setUint16(28, 0, true);
    partes.push(new Uint8Array(local.buffer), nome, f.dados);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true);
    c.setUint32(12, 0x00210000, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, f.dados.length, true);
    c.setUint32(24, f.dados.length, true);
    c.setUint16(28, nome.length, true);
    c.setUint32(42, pos, true);
    central.push(new Uint8Array(c.buffer), nome);
    pos += 30 + nome.length + f.dados.length;
  }
  const tamCentral = central.reduce((s, p) => s + p.length, 0);
  const fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true);
  fim.setUint16(8, arquivos.length, true);
  fim.setUint16(10, arquivos.length, true);
  fim.setUint32(12, tamCentral, true);
  fim.setUint32(16, pos, true);
  return [...partes, ...central, new Uint8Array(fim.buffer)];
}

export function exportarExcel(t: Tabela, nome: string) {
  const enc = new TextEncoder();
  const x = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
  const linha = (l: string[], negrito: boolean) =>
    `<row>${l.map((v) => `<c t="inlineStr"${negrito ? ' s="1"' : ""}><is><t xml:space="preserve">${x(v)}</t></is></c>`).join("")}</row>`;
  const larguras = t.cabecalho.map((h, i) => Math.min(60, Math.max(h.length, ...t.linhas.map((l) => (l[i] || "").length)) + 3));
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const M = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const P = "http://schemas.openxmlformats.org/package/2006";
  const arquivos = [
    {
      nome: "[Content_Types].xml",
      texto: `${X}<Types xmlns="${P}/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    },
    { nome: "_rels/.rels", texto: `${X}<Relationships xmlns="${P}/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { nome: "xl/workbook.xml", texto: `${X}<workbook xmlns="${M}" xmlns:r="${R}"><sheets><sheet name="Inscritos" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    {
      nome: "xl/_rels/workbook.xml.rels",
      texto: `${X}<Relationships xmlns="${P}/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${R}/styles" Target="styles.xml"/></Relationships>`,
    },
    {
      nome: "xl/styles.xml",
      texto: `${X}<styleSheet xmlns="${M}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`,
    },
    {
      nome: "xl/worksheets/sheet1.xml",
      texto: `${X}<worksheet xmlns="${M}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${larguras.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols><sheetData>${linha(t.cabecalho, true)}${t.linhas.map((l) => linha(l, false)).join("")}</sheetData></worksheet>`,
    },
  ].map((a) => ({ nome: a.nome, dados: enc.encode(a.texto) }));
  const blob = new Blob(zip(arquivos) as BlobPart[], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nome}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
