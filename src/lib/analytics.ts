/**
 * Camada de analytics "preparada": empurra os eventos para `window.dataLayer`
 * (GTM / GA4) e chama `gtag` / `fbq` somente se essas ferramentas estiverem
 * carregadas (via variáveis NEXT_PUBLIC_*). Sem ferramenta configurada, nada sai
 * do navegador, no `npm run dev` os eventos aparecem no console.
 *
 * Eventos emitidos:
 *  - cta_click        { local: "hero" | "sticky" | "menu" | "final" | "topbar" | "unidade", destino }
 *  - whatsapp_click   { local, unidade? }   (vira "Lead" no Meta Pixel)
 *  - instagram_click  { local }
 *  - agenda_click     { local }
 *  - ligar_click      { unidade? }
 *  - mapa_click       { unidade, local }
 *  - unidade_select   { unidade }
 *  - compartilhar     { metodo }
 *  - contato_salvo    {}
 */
type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
    window.gtag?.("event", event, params);
    if (window.fbq) {
      if (event === "whatsapp_click" || event === "agenda_click") window.fbq("track", "Lead", params);
      else window.fbq("trackCustom", event, params);
    }
    if (process.env.NODE_ENV !== "production") console.info("[analytics]", event, params);
  } catch {
    /* analytics nunca pode quebrar a página */
  }
}
