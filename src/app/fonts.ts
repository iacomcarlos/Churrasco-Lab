/**
 * Tipografia no estilo do flyer oficial:
 *   Montserrat  → títulos fortes e textos (uma família só, leitura limpa)
 *   Yellowtail  → frases manuscritas de apoio ("Anota aí!")
 * Baixadas no build pelo next/font (nenhum pedido ao Google no acesso do visitante).
 */
import { Montserrat, Yellowtail } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });
const yellowtail = Yellowtail({ subsets: ["latin"], weight: "400", variable: "--font-yellowtail", display: "swap" });

export const classeFontes = [montserrat.variable, yellowtail.variable].join(" ");
