/**
 * Gera os retratos dos profissionais a partir das fotos oficiais do ensaio (materiais/profissionais/<id>.png).
 * Uso: node scripts/preparar-profissionais.mjs
 * Para trocar uma foto: substitua o PNG em materiais/profissionais e rode de novo.
 */
import sharp from "sharp";
for (const n of ["jose", "jonathan", "jefferson", "gabrielle", "pedro", "andrey"]) {
  const img = sharp(`materiais/profissionais/${n}.png`);
  await img.clone().resize({ width: 880, height: 1100, fit: "cover", position: "north" }).webp({ quality: 80 }).toFile(`public/profissionais/${n}.webp`);
  await img.clone().resize({ width: 240, height: 240, fit: "cover", position: "north" }).webp({ quality: 78 }).toFile(`public/profissionais/${n}-mini.webp`);
}
console.log("retratos prontos");
