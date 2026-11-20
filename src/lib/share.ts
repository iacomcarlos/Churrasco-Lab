import { SITE_URL, evento, textos } from "@/config/evento";
import { track } from "./analytics";

/** Compartilhamento nativo do celular quando existe; senão abre o WhatsApp com a mensagem pronta. */
export async function compartilhar(local: string) {
  const text = textos.compartilhar();
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: evento.nome, text });
      track("compartilhar", { metodo: "web_share", local });
      return;
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
  }
  compartilharWhatsApp(local);
}

export const linkWhatsApp = () => `https://wa.me/?text=${encodeURIComponent(textos.compartilhar())}`;

export function compartilharWhatsApp(local: string) {
  track("compartilhar", { metodo: "whatsapp", local });
  window.open(linkWhatsApp(), "_blank", "noopener,noreferrer");
}

export { SITE_URL };
