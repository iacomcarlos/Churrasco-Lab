/**
 * Prepara a logo em camadas para a animação do site.
 * Uso: node scripts/preparar-logo.mjs "<pasta LOGO PARA ANIMAR>"
 *
 * Cada camada oficial (tela 4096 x 4096, já alinhada) é reduzida para uma tela de 1024 px
 * e aparada só na borda transparente. A posição de cada uma vai para src/config/logo-camadas.json,
 * então todas voltam exatamente ao lugar de origem. Nenhuma peça é recortada à mão nem redesenhada.
 * As letras individuais não são usadas: elas foram separadas com cortes retos e, se deslocadas,
 * mostrariam a emenda. A animação trabalha com as palavras inteiras, sempre no lugar.
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const SRC = (process.argv[2] || "").replace(/\/?$/, "/") + "01_Camadas_Principais_4K/";
const T = 1024; // tela de trabalho
const camadas = [
  ["fogo", "01_CHAMAS_E_BRASAS.png", 84],
  ["vapor-esq", "02_VAPOR_ESQUERDO.png", 90],
  ["vapor-centro", "03_VAPOR_CENTRAL.png", 90],
  ["vapor-dir", "04_VAPOR_DIREITO.png", 90],
  ["churrasco", "05_TEXTO_CHURRASCO.png", 90],
  ["lab", "06_TEXTO_LAB.png", 90],
  ["faca-esq", "07_FACA_ESQUERDA.png", 90],
  ["faca-dir", "08_FACA_DIREITA.png", 90],
  ["brasilia", "09_TEXTO_BRASILIA.png", 92],
  ["ponto-esq", "10_PONTO_ESQUERDO.png", 92],
  ["ponto-dir", "11_PONTO_DIREITO.png", 92],
];
await mkdir("public/brand/logo", { recursive: true });
const saida = {};
for (const [id, arq, q] of camadas) {
  const base = await sharp(SRC + arq).resize(T, T, { kernel: "lanczos3" }).ensureAlpha().png().toBuffer();
  const { data } = await sharp(base).raw().toBuffer({ resolveWithObject: true });
  let x0 = T, y0 = T, x1 = -1, y1 = -1;
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (data[(y * T + x) * 4 + 3] > 3) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const m = 3; // folga para não cortar nenhuma borda suave
  x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(T - 1, x1 + m); y1 = Math.min(T - 1, y1 + m);
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const info = await sharp(base).extract({ left: x0, top: y0, width: w, height: h }).webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(`public/brand/logo/${id}.webp`);
  const pct = (v) => +((v / T) * 100).toFixed(4);
  saida[id] = { src: `/brand/logo/${id}.webp`, x: pct(x0), y: pct(y0), w: pct(w), h: pct(h), largura: w, altura: h };
  console.log(id.padEnd(13), `${w}x${h}`.padEnd(10), (info.size / 1024).toFixed(0) + " KB");
}
// brilho de fundo: o fogo bem desfocado e pequeno, para preencher com luz quente as áreas atrás das letras
{
  const fogo = await sharp(SRC + "01_CHAMAS_E_BRASAS.png").resize(256, 256).ensureAlpha().blur(7).webp({ quality: 70, alphaQuality: 80 }).toFile("public/brand/logo/brilho.webp");
  saida.brilho = { src: "/brand/logo/brilho.webp", x: 0, y: 0, w: 100, h: 100, largura: 256, altura: 256 };
  console.log("brilho".padEnd(13), "256x256".padEnd(10), (fogo.size / 1024).toFixed(0) + " KB");
}
await writeFile("src/config/logo-camadas.json", JSON.stringify(saida, null, 2) + "\n");
console.log("camadas prontas");
