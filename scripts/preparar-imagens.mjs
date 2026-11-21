/**
 * Gera as imagens do site a partir dos materiais oficiais.
 * Uso: node scripts/preparar-imagens.mjs "<pasta com o manual e as fotos dos profissionais>"
 *
 * Fontes:
 *   materiais/arte-principal.webp  → a carne na grelha (rodapé)
 *   materiais/flyer.webp           → régua de marcas (realização e parceria)
 *   <pasta>/4.png                  → logo branca de 1 cor (manual, página "Versões")
 *   <pasta>/FOTOS  e currículoS    → retratos enviados pelos profissionais
 * Nada é redesenhado: são recortes das peças oficiais. Quando chegarem os arquivos
 * originais das marcas, basta substituir os arquivos em public/brand.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = (process.argv[2] || "").replace(/\/?$/, "/");
const P = "FOTOS  e currículoS/";
for (const d of ["public/brand", "public/fotos", "public/profissionais"]) await mkdir(d, { recursive: true });
const ARTE = "materiais/arte-principal.webp";
const FLYER = "materiais/flyer.webp";

/* ── Logo branca (1 cor), com transparência real ── */
if (SRC !== "/") {
  const { data, info } = await sharp(SRC + "4.png").extract({ left: 1205, top: 585, width: 320, height: 240 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const l = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
    out[j] = 255; out[j + 1] = 255; out[j + 2] = 255;
    out[j + 3] = Math.round(Math.max(0, Math.min(1, (l - 0.2) / 0.62)) * 255);
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).trim().png().toFile("public/brand/logo-branca.png");
}

/* ── Carne na grelha (recortes abaixo da logo, para ela não aparecer no fundo) ── */
await sharp(ARTE).extract({ left: 0, top: 704, width: 1660, height: 244 }).webp({ quality: 84 }).toFile("public/fotos/grelha-carne.webp");
await sharp(ARTE).extract({ left: 905, top: 520, width: 755, height: 428 }).webp({ quality: 84 }).toFile("public/fotos/grelha-carne-celular.webp");

/* ── Profissionais (fotos enviadas pela organização) ── */
if (SRC !== "/") {
  const prof = [
    ["JONATHAN NOBRE /JONATHAN NOBRE.jpg", "jonathan"],
    ["JEFFERSON (BRASEIRO 61)/JEFFERSON (BRASEIRO 61).jpeg", "jefferson"],
    ["GABRIELLE (RUSTICANO)/GABRIELLE (RUSTICANO).jpeg", "gabrielle"],
    ["PEDRO (061 BBQ)/PEDRO (061 BBQ).jpeg", "pedro"],
    ["ANDREY ANGELIM/ANDREY ANGELIM.jpeg", "andrey"],
  ];
  for (const [f, n] of prof) {
    const img = sharp(SRC + P + f).rotate();
    await img.clone().resize({ width: 900, height: 1200, fit: "cover", position: "north" }).webp({ quality: 80 }).toFile(`public/profissionais/${n}.webp`);
    await img.clone().resize({ width: 240, height: 240, fit: "cover", position: "north" }).webp({ quality: 78 }).toFile(`public/profissionais/${n}-mini.webp`);
  }
}
console.log("imagens prontas");
