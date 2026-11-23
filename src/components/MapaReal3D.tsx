"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { evento } from "@/config/evento";

/** Praça da Bíblia, P Norte, Ceilândia (ponto do OpenStreetMap; confere com o endereço QNP 19 do Google Maps). */
const PRACA: [number, number] = [-48.1351198, -15.8056097];

/**
 * Mapa real em 3D do local: imagem de satélite inclinada, com as construções em relevo onde o
 * mapa colaborativo tem a altura delas, e a câmera girando devagar em volta da praça.
 * Um dedo continua rolando a página; para mexer no mapa no celular são dois dedos (o próprio mapa avisa).
 * Se o aparelho não tiver 3D, chama `semSuporte` e a seção mostra o mapa comum.
 */
export default function MapaReal3D({ semSuporte }: { semSuporte: () => void }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: el,
        center: PRACA,
        zoom: 16.5,
        pitch: 64,
        bearing: -24,
        maxPitch: 78,
        minZoom: 13,
        maxZoom: 18.4,
        attributionControl: { compact: true },
        cooperativeGestures: true,
        locale: {
          "CooperativeGesturesHandler.WindowsHelpText": "Use Ctrl + rolagem para aproximar o mapa",
          "CooperativeGesturesHandler.MacHelpText": "Use ⌘ + rolagem para aproximar o mapa",
          "CooperativeGesturesHandler.MobileHelpText": "Use dois dedos para mover o mapa",
          "NavigationControl.ZoomIn": "Aproximar",
          "NavigationControl.ZoomOut": "Afastar",
          "NavigationControl.ResetBearing": "Arraste para girar. Clique para voltar ao norte",
        },
        style: {
          version: 8,
          sources: {
            satelite: {
              type: "raster",
              tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
              tileSize: 256,
              maxzoom: 19,
              attribution: "Imagens © Esri, Maxar, Earthstar Geographics",
            },
            ruas: {
              type: "raster",
              tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"],
              tileSize: 256,
              maxzoom: 19,
            },
            osm: { type: "vector", url: "https://tiles.openfreemap.org/planet", attribution: "© OpenStreetMap" },
          },
          sky: { "sky-color": "#2a1a12", "horizon-color": "#f47a12", "fog-color": "#3a2114", "sky-horizon-blend": 0.6, "horizon-fog-blend": 0.7, "fog-ground-blend": 0.35 },
          layers: [
            { id: "fundo", type: "background", paint: { "background-color": "#100a07" } },
            { id: "satelite", type: "raster", source: "satelite", paint: { "raster-brightness-max": 0.92, "raster-contrast": 0.08, "raster-saturation": 0.05 } },
            { id: "ruas", type: "raster", source: "ruas", paint: { "raster-opacity": 0.85 } },
            {
              id: "construcoes",
              type: "fill-extrusion",
              source: "osm",
              "source-layer": "building",
              minzoom: 14.5,
              paint: {
                "fill-extrusion-color": "#e6c9a4",
                "fill-extrusion-height": ["coalesce", ["get", "render_height"], 4],
                "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
                "fill-extrusion-opacity": 0.82,
              },
            },
          ],
        },
      });
    } catch {
      semSuporte();
      return;
    }

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    /* marcador da praça */
    const pino = document.createElement("div");
    pino.className = "pino-praca";
    pino.innerHTML = `<span class="pino-rotulo">${evento.local.nome}</span><span class="pino-bola"></span><span class="pino-haste"></span>`;
    new maplibregl.Marker({ element: pino, anchor: "bottom" }).setLngLat(PRACA).addTo(map);

    /* gira devagar em volta da praça até a pessoa mexer no mapa; só enquanto está na tela */
    const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let girar = !calmo;
    let visivel = false;
    let raf = 0;
    let antes = 0;
    const passo = (agora: number) => {
      raf = 0;
      if (!girar || !visivel) return;
      const dt = Math.min(60, agora - antes || 16);
      antes = agora;
      map.setBearing(map.getBearing() + dt * 0.004);
      raf = requestAnimationFrame(passo);
    };
    const liga = () => {
      if (!raf && girar && visivel) {
        antes = performance.now();
        raf = requestAnimationFrame(passo);
      }
    };
    const para = () => {
      girar = false;
      cancelAnimationFrame(raf);
    };
    ["mousedown", "touchstart", "wheel", "keydown"].forEach((ev) => el.addEventListener(ev, para, { passive: true }));
    const io = new IntersectionObserver(([x]) => {
      visivel = x.isIntersecting;
      liga();
    });
    io.observe(el);
    map.once("load", () => {
      setPronto(true);
      liga();
    });
    map.on("error", () => undefined);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      map.remove();
    };
  }, [semSuporte]);

  return (
    <>
      <div ref={caixa} role="region" aria-label={`Mapa 3D: ${evento.local.buscaMapa}`} className={`mapa-real absolute inset-0 transition-opacity duration-700 ${pronto ? "opacity-100" : "opacity-0"}`} />
      {!pronto && <p className="espacado pointer-events-none absolute inset-0 grid place-items-center text-[12px] font-bold text-suave">Carregando o mapa...</p>}
    </>
  );
}
