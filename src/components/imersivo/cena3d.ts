import * as THREE from "three";

/**
 * O evento em 3D, montado a partir da PLANTA BAIXA PRELIMINAR (versão 6) enviada pela organização
 * em 27/11/2026: tenda galpão de 30 × 40 m, com a entrada de 20 m voltada para o estacionamento.
 * As medidas, as posições, os nomes (C1, E7, Alim. 3, Bar 2...) e as cores saem da planta.
 * Cada espaço leva o nome e o tamanho escritos por cima, como na planta, e há réguas de 30 m e 40 m.
 * Formas simples, sem modelos prontos. Fica num arquivo separado para o navegador só baixar o 3D
 * quando o mapa estiver chegando na tela.
 *
 * Planta → cena: x da planta (0 a 30, da esquerda para a direita) vira x - 15;
 * y da planta (0 no fundo/backstage, 40 na entrada) vira z = y - 20. A entrada fica virada para a câmera,
 * e os textos são escritos para serem lidos desse lado.
 *
 * Câmera: gira em volta de um alvo. Sem espaço escolhido, mostra a tenda inteira balançando devagar
 * de um lado para o outro (sem dar a volta, para os nomes não ficarem de cabeça para baixo);
 * com um espaço escolhido, voa até ele. Arrastar para os lados gira a cena à vontade.
 */

/** `az` = de onde a câmera olha o espaço (0 = do lado da entrada); `raio` = distância. */
export type Zona = { id: string; x: number; z: number; alt: number; az: number; raio: number; halo: number };

const P = (x: number, y: number) => ({ x: x - 15, z: y - 20 });

export const ZONAS: Zona[] = [
  { id: "palco", ...P(14.9, 9.5), alt: 8, az: 0.3, raio: 27, halo: 5.8 },
  { id: "arena", ...P(24.65, 13), alt: 4.4, az: -0.45, raio: 19, halo: 4.4 },
  { id: "churrasco", ...P(7, 11.8), alt: 5, az: 0.4, raio: 27, halo: 4.7 },
  { id: "solidaria", ...P(22.4, 27.5), alt: 5, az: -0.5, raio: 26, halo: 5.3 },
  { id: "praca", ...P(4.6, 26.2), alt: 5, az: 0.3, raio: 27, halo: 5.1 },
  { id: "bares", ...P(24.4, 19), alt: 5.6, az: -0.4, raio: 17, halo: 3.2 },
  { id: "podcast", ...P(22.4, 36), alt: 5.4, az: -0.35, raio: 16, halo: 3.2 },
  { id: "insta", ...P(14, 30), alt: 5.4, az: 0.25, raio: 17, halo: 3.5 },
  { id: "entrada", ...P(15, 40.8), alt: 9, az: 0.22, raio: 26, halo: 0 },
];

const COR = {
  chao: 0x2a1b12,
  piso: 0x3d2a1c,
  madeira: 0x6b4426,
  madeiraEscura: 0x54361f,
  ferro: 0x4a4038,
  estrutura: 0x8a7868,
  aco: 0x8c9196,
  lona: 0xf4ece2,
  brasa: 0xf47a12,
  ambar: 0xffab33,
  verde: 0x27452d,
  vermelho: 0xd8342a,
  saida: 0x4fae62,
};

/** Cores de cada tipo de espaço, as mesmas da legenda da planta. `teto` recebe o nome escrito. */
const PAL = {
  churrasco: { teto: "#e3caa0", faixa: 0x8a6a35, tinta: "#3f2c10" },
  duplo: { teto: "#d5b07c", faixa: 0x7a5626, tinta: "#3a260c" },
  solidaria: { teto: "#c6e0c5", faixa: 0x3f7d4a, tinta: "#1c4526" },
  alimentacao: { teto: "#e9a268", faixa: 0x9a5326, tinta: "#3d1c08" },
  bar: { teto: "#f1d98c", faixa: 0xb8912f, tinta: "#3a2a08" },
  backstage: { teto: "#cfd7e8", faixa: 0x6f7fa3, tinta: "#27324a" },
  podcast: { teto: "#8fc6bf", faixa: 0x3f8a82, tinta: "#12393a" },
  camarote: { teto: "#e3d5f0", faixa: 0x8f76c9, tinta: "#3c2a63" },
  credenciamento: { teto: "#d8c8ee", faixa: 0x8f76c9, tinta: "#3c2a63" },
  infra: { teto: "#d0d3d9", faixa: 0x7b818c, tinta: "#2a2d33" },
  palco: { teto: "#3a302b", faixa: 0x3a302b, tinta: "#ffffff" },
} as const;
type Tipo = keyof typeof PAL;

const FRENTE = { "+z": 0, "+x": Math.PI / 2, "-z": Math.PI, "-x": -Math.PI / 2 } as const;
type Lado = keyof typeof FRENTE;

export type Cena = {
  focar: (id: string | null) => void;
  ativo: (ligado: boolean) => void;
  destruir: () => void;
};

export function criarCena(opts: {
  canvas: HTMLCanvasElement;
  caixa: HTMLElement;
  pinos: Record<string, HTMLElement | null>;
  aoEscolher: (id: string) => void;
  calmo: boolean;
  /** Família de letras do site, para os nomes escritos na maquete. */
  fonte: string;
}): Cena {
  const { canvas, caixa, pinos, aoEscolher, calmo, fonte } = opts;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  const nitidez = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 1, 400);

  /* ── materiais e formas ── */
  const mats = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (cor: number, emissivo = 0, opacidade = 1) => {
    const k = `${cor}-${emissivo}-${opacidade}`;
    let m = mats.get(k);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.82, metalness: 0.04, flatShading: true });
      if (emissivo) {
        m.emissive = new THREE.Color(cor);
        m.emissiveIntensity = emissivo;
      }
      if (opacidade < 1) {
        m.transparent = true;
        m.opacity = opacidade;
        m.depthWrite = false;
      }
      mats.set(k, m);
    }
    return m;
  };
  const caixaG = new THREE.BoxGeometry(1, 1, 1);
  const cilG = new THREE.CylinderGeometry(1, 1, 1, 18);
  const esfG = new THREE.SphereGeometry(1, 12, 10);
  const planoG = new THREE.PlaneGeometry(1, 1);

  const add = (pai: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    o.scale.set(sx, sy, sz);
    pai.add(o);
    return o;
  };
  const bloco = (pai: THREE.Object3D, w: number, h: number, d: number, cor: number, x: number, y: number, z: number, emissivo = 0, opacidade = 1) => add(pai, caixaG, mat(cor, emissivo, opacidade), x, y, z, w, h, d);
  const cil = (pai: THREE.Object3D, r: number, h: number, cor: number, x: number, y: number, z: number, emissivo = 0) => add(pai, cilG, mat(cor, emissivo), x, y, z, r, h, r);
  const luz = (pai: THREE.Object3D, cor: number, forca: number, x: number, y: number, z: number, alcance = 18) => {
    const l = new THREE.PointLight(cor, forca, alcance, 1.5);
    l.position.set(x, y, z);
    pai.add(l);
    return l;
  };
  const hex = (c: string) => parseInt(c.slice(1), 16);

  /**
   * Nome escrito sobre um espaço, deitado, lido do lado da entrada (como na planta).
   * (x, y) = centro na planta; `alt` = altura; `w` × `d` = tamanho em metros; `giro` vira o texto (π/2 = de baixo para cima).
   * Com `fundo`, a placa é opaca (um teto, por exemplo); sem fundo, só as letras, para escrever no chão.
   */
  const placa = (x: number, y: number, alt: number, w: number, d: number, titulo: string, sub = "", cor = "#f7f1e9", fundo: string | null = null, giro = 0, peso = 800) => {
    const ppm = Math.min(120, 720 / Math.max(w, d));
    const cv = document.createElement("canvas");
    cv.width = Math.max(8, Math.round(w * ppm));
    cv.height = Math.max(8, Math.round(d * ppm));
    const g = cv.getContext("2d");
    if (!g) return;
    if (fundo) {
      g.fillStyle = fundo;
      g.fillRect(0, 0, cv.width, cv.height);
    }
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = cor;
    const larg = cv.width * 0.88;
    const cabe = (txt: string, p: number, max: number) => {
      g.font = `${p} ${max}px ${fonte}`;
      const m = g.measureText(txt).width;
      return m > larg ? (max * larg) / m : max;
    };
    const s1 = cabe(titulo, peso, cv.height * (sub ? 0.4 : 0.62));
    const s2 = sub ? cabe(sub, 600, Math.min(s1 * 0.56, cv.height * 0.24)) : 0;
    const total = s1 + (sub ? s2 * 1.3 : 0);
    const y1 = cv.height / 2 - total / 2 + s1 / 2;
    g.font = `${peso} ${s1}px ${fonte}`;
    g.fillText(titulo, cv.width / 2, y1);
    if (sub) {
      g.font = `600 ${s2}px ${fonte}`;
      g.globalAlpha = 0.86;
      g.fillText(sub, cv.width / 2, y1 + s1 / 2 + s2 * 0.82);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = nitidez;
    const m = new THREE.Mesh(planoG, new THREE.MeshBasicMaterial({ map: tex, transparent: !fundo, depthWrite: Boolean(fundo), toneMapped: false }));
    const p = P(x, y);
    m.position.set(p.x, alt, p.z);
    m.rotation.set(-Math.PI / 2, 0, giro);
    m.scale.set(w, d, 1);
    m.renderOrder = fundo ? 0 : 2;
    cena.add(m);
  };

  /* retângulos ocupados (em metros da planta), para o público não nascer dentro das coisas */
  const ocupado: [number, number, number, number][] = [];
  /** Grupo posicionado pelo CENTRO na planta, com a frente virada para `lado`. `fr` × `fu` = frente × fundo. */
  const grupo = (cx: number, cy: number, lado: Lado, fr: number, fu: number, zona?: string) => {
    const g = new THREE.Group();
    const p = P(cx, cy);
    g.position.set(p.x, 0, p.z);
    g.rotation.y = FRENTE[lado];
    if (zona) g.userData.zona = zona;
    cena.add(g);
    const deitado = lado === "+x" || lado === "-x";
    const w = deitado ? fu : fr;
    const d = deitado ? fr : fu;
    ocupado.push([cx - w / 2, cy - d / 2, cx + w / 2, cy + d / 2]);
    return { g, w, d };
  };

  /* ── luz geral: fim de tarde quente ── */
  cena.add(new THREE.HemisphereLight(0xffe2c4, 0x3a2416, 2.1));
  const sol = new THREE.DirectionalLight(0xffcf9a, 2.5);
  sol.position.set(14, 26, 22);
  cena.add(sol);

  /* ── terreno, piso da tenda e as faixas de cada setor (cores da planta) ── */
  bloco(cena, 54, 0.7, 62, COR.chao, 0, -0.36, 3);
  bloco(cena, 30, 0.06, 40, COR.piso, 0, 0.03, 0);
  const faixa = (x0: number, y0: number, x1: number, y1: number, cor: number, forca: number) => {
    const m = new THREE.Mesh(caixaG, new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: forca, depthWrite: false }));
    const p = P((x0 + x1) / 2, (y0 + y1) / 2);
    m.position.set(p.x, 0.075, p.z);
    m.scale.set(x1 - x0, 0.02, y1 - y0);
    cena.add(m);
  };
  faixa(0, 0, 10, 19.6, 0xe3caa0, 0.2); // setor churrasco
  faixa(0, 20.4, 9.2, 40, 0xe9a268, 0.26); // praça de alimentação
  faixa(19, 20.4, 30, 39.8, 0x8fcf96, 0.2); // economia solidária
  faixa(7, 4, 23, 5.5, 0xcfd7e8, 0.22); // circulação do backstage
  faixa(10.4, 21.4, 16.8, 26.5, 0xe3caa0, 0.16); // ilha central do setor churrasco
  faixa(10.9, 27.6, 17.3, 34, 0xe3caa0, 0.14); // área do instagramável

  /* ── estrutura da tenda galpão: pilares, vigas e a cumeeira (sem a lona, para ver dentro) ── */
  {
    const alt = 5.4;
    const cume = 8.2;
    for (const y of [0, 10, 20, 30, 40]) {
      for (const x of [0, 30]) bloco(cena, 0.24, alt, 0.24, COR.estrutura, P(x, y).x, alt / 2, P(x, y).z);
      const comp = Math.hypot(15, cume - alt);
      const ang = Math.atan2(cume - alt, 15);
      const e = bloco(cena, comp, 0.1, 0.1, COR.estrutura, -7.5, (alt + cume) / 2, P(0, y).z, 0, 0.28);
      e.rotation.z = ang;
      const d = bloco(cena, comp, 0.1, 0.1, COR.estrutura, 7.5, (alt + cume) / 2, P(0, y).z, 0, 0.28);
      d.rotation.z = -ang;
    }
    for (const x of [0, 30]) bloco(cena, 0.1, 0.1, 40, COR.estrutura, P(x, 0).x, alt, 0, 0, 0.28);
    bloco(cena, 0.1, 0.1, 40, COR.estrutura, 0, cume, 0, 0, 0.28);
    /* lona do fundo e das laterais, bem transparente, e o contorno da tenda no chão */
    bloco(cena, 30, alt, 0.06, COR.lona, 0, alt / 2, -20, 0, 0.1);
    for (const x of [0, 30]) bloco(cena, 0.06, alt, 40, COR.lona, P(x, 0).x, alt / 2, 0, 0, 0.06);
    bloco(cena, 30.3, 0.14, 0.3, 0x15100d, 0, 0.1, -20);
    for (const x of [0, 30]) bloco(cena, 0.3, 0.14, 40.3, 0x15100d, P(x, 0).x, 0.1, 0);
    for (const [x0, x1] of [
      [0, 5],
      [25, 30],
    ])
      bloco(cena, x1 - x0, 0.14, 0.3, 0x15100d, P((x0 + x1) / 2, 40).x, 0.1, 20);
  }

  /* ── saídas (verde, como na planta) e a entrada de 20 m ── */
  bloco(cena, 0.36, 0.16, 3, COR.saida, P(0, 17.5).x, 0.11, P(0, 17.5).z, 1.2);
  bloco(cena, 0.36, 0.16, 3, COR.saida, P(30, 17.5).x, 0.11, P(30, 17.5).z, 1.2);
  bloco(cena, 4, 0.16, 0.36, COR.saida, P(25, 0).x, 0.11, P(25, 0).z, 1.2);
  bloco(cena, 20, 0.05, 0.18, COR.saida, 0, 0.11, 20, 1.2);
  placa(-1.5, 17.5, 0.08, 3.6, 0.9, "SAÍDA", "", "#7fd693", null, Math.PI / 2);
  placa(31.5, 17.5, 0.08, 3.6, 0.9, "SAÍDA", "", "#7fd693", null, -Math.PI / 2);
  placa(25, -1, 0.08, 6, 0.9, "SAÍDA · serviço", "", "#7fd693");
  placa(15, 38.9, 0.1, 9, 1.1, "ENTRADA · 20 m", "", "#7fd693");
  placa(15, 37.3, 0.1, 8, 0.8, "HALL DE ENTRADA", "", "#d9cbbb", null, 0, 700);

  /* ── réguas de medida: 30 m de largura e 40 m de comprimento ── */
  {
    const tinta = 0xd9cbbb;
    const yb = -3.1;
    bloco(cena, 30, 0.06, 0.08, tinta, 0, 0.08, P(0, yb).z);
    for (const x of [0, 30]) bloco(cena, 0.08, 0.06, 1.1, tinta, P(x, 0).x, 0.08, P(0, yb).z);
    placa(15, yb - 1.1, 0.08, 6, 1.4, "30 m", "", "#f7f1e9");
    const xe = -9;
    bloco(cena, 0.08, 0.06, 40, tinta, P(xe, 0).x, 0.08, 0);
    for (const y of [0, 40]) bloco(cena, 1.1, 0.06, 0.08, tinta, P(xe, 0).x, 0.08, P(0, y).z);
    placa(xe - 1.1, 20, 0.08, 6, 1.4, "40 m", "", "#f7f1e9", null, Math.PI / 2);
  }

  /* ── halos no chão: marcam os espaços; o escolhido acende ── */
  const halos = new Map<string, THREE.Mesh[]>();
  const halo = (id: string, x: number, z: number, r: number) => {
    const h = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.26, 56), new THREE.MeshBasicMaterial({ color: COR.brasa, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    h.rotation.x = -Math.PI / 2;
    h.position.set(x, 0.14, z);
    h.renderOrder = 3;
    cena.add(h);
    halos.set(id, [...(halos.get(id) ?? []), h]);
  };
  for (const z of ZONAS) if (z.halo) halo(z.id, z.x, z.z, z.halo);
  halo("bares", P(6.5, 34).x, P(6.5, 34).z, 3.2); // o segundo bar

  /* ── backstage: dois apoios, camarim e cozinha (4 × 4 cada), acesso restrito ── */
  (["Apoio 1", "Apoio 2", "Camarim", "Cozinha"] as const).forEach((nome, i) => {
    const x = 9 + i * 4;
    const { g } = grupo(x, 2, "+z", 4, 4);
    bloco(g, 3.9, 2.8, 3.9, 0x7d8aa6, 0, 1.4, 0);
    bloco(g, 4, 0.14, 4, PAL.backstage.faixa, 0, 2.87, 0);
    bloco(g, 1, 2, 0.06, COR.lona, 0, 1, 1.97);
    placa(x, 2, 2.96, 3.9, 3.9, nome, "4×4", PAL.backstage.tinta, PAL.backstage.teto);
  });
  placa(15, -1.4, 0.08, 12, 1, "BACKSTAGE · acesso restrito", "", "#a9b8dc", null, 0, 700);
  placa(15, 4.75, 0.1, 13, 0.62, "circulação backstage · acesso ao palco", "", "#c7d2ee", null, 0, 600);

  /* ── palco 8 × 6 m (aulas-show e painéis) e a plateia de 54 lugares ── */
  {
    const { g } = grupo(14.9, 8.5, "+z", 8, 6, "palco");
    bloco(g, 8, 0.7, 6, 0x3a2a22, 0, 0.35, 0);
    bloco(g, 8, 4.2, 0.2, COR.ferro, 0, 2.8, -2.9);
    bloco(g, 5.6, 1.3, 0.06, COR.brasa, 0, 3.6, -2.78, 0.9);
    bloco(g, 8.5, 0.26, 6.4, COR.ferro, 0, 5.1, 0);
    for (const sx of [-3.85, 3.85]) for (const sz of [-2.8, 2.8]) bloco(g, 0.2, 4.6, 0.2, COR.ferro, sx, 2.9, sz);
    bloco(g, 3.4, 0.9, 0.9, COR.aco, -0.8, 1.15, 1.2);
    bloco(g, 1.2, 0.75, 0.8, COR.ferro, 2.4, 1.08, 1.2);
    bloco(g, 1.05, 0.06, 0.65, COR.brasa, 2.4, 1.48, 1.2, 1.6);
    for (const sx of [-3.3, 3.3]) bloco(g, 0.8, 1.5, 0.7, 0x2b2623, sx, 1.45, 2.3);
    luz(g, 0xff8a2a, 40, 0, 4, 2);
    placa(14.9, 8.5, 5.25, 8.5, 6.4, "PALCO 8×6 m", "aulas-show · painéis", PAL.palco.tinta, PAL.palco.teto);

    ocupado.push([10.9, 13, 20, 19.9]);
    faixa(10.9, 13, 20, 19.9, 0xefeae2, 0.16);
    const cadeiras = new THREE.InstancedMesh(caixaG, mat(COR.lona), 54);
    const m4 = new THREE.Matrix4();
    [13.5, 14.35, 15.2, 17.75, 18.6, 19.45].forEach((y, f) => {
      for (let c = 0; c < 9; c++) {
        const p = P(11.5 + c * 1, y);
        m4.makeScale(0.5, 0.5, 0.5).setPosition(p.x, 0.3, p.z);
        cadeiras.setMatrixAt(f * 9 + c, m4);
      }
    });
    cadeiras.userData.zona = "palco";
    cena.add(cadeiras);
    placa(15.45, 16.45, 0.1, 8.4, 1.5, "PLATEIA · 54 lugares", "aulas-show e painéis", "#f7f1e9");
  }

  /* ── camarote (tablado elevado e aberto, 6,5 × 4,5 m, ao lado do backstage) ── */
  {
    const { g } = grupo(26.65, 6.75, "+z", 6.5, 4.5);
    bloco(g, 6.5, 0.6, 4.5, COR.madeiraEscura, 0, 0.3, 0);
    bloco(g, 6.5, 0.1, 0.1, PAL.camarote.faixa, 0, 1.6, 2.2, 0.5);
    bloco(g, 6.5, 0.1, 0.1, PAL.camarote.faixa, 0, 1.6, -2.2, 0.5);
    bloco(g, 0.1, 0.1, 4.5, PAL.camarote.faixa, -3.2, 1.6, 0, 0.5);
    for (const sx of [-3.2, -1.6, 0, 1.6, 3.2]) bloco(g, 0.08, 1, 0.08, COR.ferro, sx, 1.1, 2.2);
    for (const sx of [-2.5, 2.5]) {
      cil(g, 0.4, 0.06, COR.madeira, sx, 1.7, -1.4);
      cil(g, 0.06, 1.1, COR.ferro, sx, 1.15, -1.4);
    }
    for (const sx of [-0.5, 0.5]) cil(g, 0.3, 0.8, 0x8a8f96, sx, 1, -1.6);
    placa(26.65, 7.1, 0.63, 6.1, 2.2, "CAMAROTE VIP", "tablado elevado · aberto · 6,5×4,5 m", PAL.camarote.tinta, PAL.camarote.teto);
    placa(26.65, 9.6, 0.09, 5, 0.5, "acesso pelo backstage", "", "#c9b6ee", null, 0, 600);
  }

  /* ── arena do fogo de chão (6,5 × 5 m): gradil, fogueira e as carnes em volta ── */
  const fogo = P(24.65, 13);
  const brasaLuz = (() => {
    const { g } = grupo(24.65, 13, "+z", 6.5, 5, "arena");
    faixa(21.4, 10.5, 27.9, 15.5, 0xf2c79c, 0.3);
    for (const y of [0.55, 1]) {
      bloco(g, 6.5, 0.07, 0.07, 0x9a5326, 0, y, 2.5);
      bloco(g, 6.5, 0.07, 0.07, 0x9a5326, 0, y, -2.5);
      bloco(g, 0.07, 0.07, 5, 0x9a5326, 3.25, y, 0);
      bloco(g, 0.07, 0.07, 5, 0x9a5326, -3.25, y, 0);
    }
    for (const sx of [-3.25, -1.6, 0, 1.6, 3.25]) for (const sz of [-2.5, 2.5]) bloco(g, 0.09, 1.05, 0.09, 0x9a5326, sx, 0.52, sz);
    cil(g, 1.1, 0.28, 0x3b2a22, 0, 0.14, 0.15);
    cil(g, 0.92, 0.06, COR.brasa, 0, 0.31, 0.15, 2.4);
    for (let i = 0; i < 3; i++) {
      const t = bloco(g, 1.3, 0.2, 0.22, 0x2a1a12, 0, 0.42, 0.15);
      t.rotation.y = (i * Math.PI) / 3;
    }
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3;
      const e = new THREE.Group();
      e.position.set(Math.sin(a) * 1.5, 0, 0.15 + Math.cos(a) * 1.5);
      e.rotation.y = a;
      g.add(e);
      const estaca = bloco(e, 0.06, 1.9, 0.06, COR.aco, 0, 0.9, -0.2);
      estaca.rotation.x = -0.32;
      const carne = bloco(e, 0.5, 0.8, 0.14, 0x8a3324, 0, 1.2, -0.32);
      carne.rotation.x = -0.32;
    }
    placa(24.65, 10.95, 0.1, 6.1, 0.62, "ARENA FOGO DE CHÃO", "", "#ffd7b0");
    placa(24.65, 15.12, 0.1, 6.1, 0.5, "aula-show · gradil · público em volta · 6,5×5 m", "", "#ffd7b0", null, 0, 600);
    return luz(g, 0xff7a1a, 50, 0, 1.8, 0.15, 16);
  })();

  /* ── estandes: frente × fundo em metros; o teto leva o nome e o tamanho ── */
  const estande = (nome: string, cx: number, cy: number, lado: Lado, fr: number, fu: number, tipo: Tipo, zona: string) => {
    const { g, w, d } = grupo(cx, cy, lado, fr, fu, zona);
    const c = PAL[tipo];
    const teto = hex(c.teto);
    bloco(g, fr * 0.96, 2.2, 0.06, teto, 0, 1.1, -fu / 2 + 0.05);
    bloco(g, 0.06, 2.2, fu * 0.6, teto, -fr / 2 + 0.05, 1.1, -fu * 0.18);
    bloco(g, 0.06, 2.2, fu * 0.6, teto, fr / 2 - 0.05, 1.1, -fu * 0.18);
    bloco(g, fr * 0.92, 0.9, 0.5, COR.madeira, 0, 0.45, fu / 2 - 0.34);
    bloco(g, fr * 0.92, 0.08, 0.54, c.faixa, 0, 0.94, fu / 2 - 0.34);
    bloco(g, fr, 0.34, 0.1, c.faixa, 0, 2.2, fu / 2 - 0.05);
    bloco(g, fr, 0.16, fu, teto, 0, 2.38, 0);
    for (const s of [-1, 1]) bloco(g, 0.07, 2.3, 0.07, COR.ferro, (s * fr) / 2 - s * 0.05, 1.15, fu / 2 - 0.06);
    placa(cx, cy, 2.48, w * 0.99, d * 0.99, nome, `${w}×${d}`, c.tinta, c.teto);
  };
  /* setor churrasco: 15 expositores (C1 a C13 de 2 × 3, mais os duplos C14 e C15 de 6 × 2) */
  for (let k = 0; k < 5; k++) estande(`C${k + 1}`, 1, 1.5 + k * 3, "+x", 3, 2, "churrasco", "churrasco");
  [
    [6, 5],
    [10, 12.5],
  ].forEach(([n0, y0]) => {
    estande(`C${n0}`, 6, y0 + 1.5, "-x", 3, 2, "churrasco", "churrasco");
    estande(`C${n0 + 1}`, 8, y0 + 1.5, "+x", 3, 2, "churrasco", "churrasco");
    estande(`C${n0 + 2}`, 6, y0 + 4.5, "-x", 3, 2, "churrasco", "churrasco");
    estande(`C${n0 + 3}`, 8, y0 + 4.5, "+x", 3, 2, "churrasco", "churrasco");
  });
  estande("C14 · duplo", 13.5, 22.9, "-z", 6, 2, "duplo", "churrasco");
  estande("C15 · duplo", 13.5, 25, "+z", 6, 2, "duplo", "churrasco");
  placa(10, 9.8, 0.1, 9, 0.7, "SETOR CHURRASCO · 15", "", "#e9c98f", null, Math.PI / 2);
  placa(13.5, 21.5, 0.1, 6, 0.5, "ilha central · Setor Churrasco", "", "#e9c98f", null, 0, 600);
  luz(cena, 0xffb060, 20, P(4, 9).x, 3.8, P(4, 9).z, 14);

  /* economia solidária: 15 expositores (E1 a E6 na parede, duas ilhas de quatro e o E15 na entrada) */
  for (let k = 0; k < 6; k++) estande(`E${k + 1}`, 29, 21.5 + k * 3, "-x", 3, 2, "solidaria", "solidaria");
  [
    [7, 22.4],
    [11, 28.4],
  ].forEach(([n0, y0]) => {
    estande(`E${n0}`, 20.9, y0 + 1, "-z", 3, 2, "solidaria", "solidaria");
    estande(`E${n0 + 1}`, 23.9, y0 + 1, "-z", 3, 2, "solidaria", "solidaria");
    estande(`E${n0 + 2}`, 20.9, y0 + 3.1, "+z", 3, 2, "solidaria", "solidaria");
    estande(`E${n0 + 3}`, 23.9, y0 + 3.1, "+z", 3, 2, "solidaria", "solidaria");
  });
  estande("E15", 26.4, 39, "-z", 3, 2, "solidaria", "solidaria");
  placa(22.4, 27.45, 0.1, 6.6, 0.6, "SETOR ECON. SOLIDÁRIA · 15", "", "#a7e0b0");
  luz(cena, 0xfff0c0, 20, P(26.4, 27).x, 3.8, P(26.4, 27).z, 14);

  /* ── praça de alimentação: cinco pontos de 3 × 3 que assam na hora e dez mesas com 4 cadeiras ── */
  for (let k = 0; k < 5; k++) {
    const cy = 22.5 + k * 3;
    const { g } = grupo(1.5, cy, "+x", 3, 3, "praca");
    const c = PAL.alimentacao;
    const teto = hex(c.teto);
    bloco(g, 2.9, 2.5, 0.08, COR.lona, 0, 1.25, -1.42);
    bloco(g, 0.08, 2.5, 2.9, COR.lona, -1.42, 1.25, 0);
    bloco(g, 0.08, 2.5, 2.9, COR.lona, 1.42, 1.25, 0);
    bloco(g, 3, 0.4, 0.12, c.faixa, 0, 2.5, 1.44);
    bloco(g, 3, 0.14, 3, teto, 0, 2.72, 0);
    bloco(g, 1.7, 0.8, 0.7, COR.ferro, 0.2, 0.4, 0.9);
    bloco(g, 1.55, 0.06, 0.55, COR.brasa, 0.2, 0.83, 0.9, 1.8);
    placa(1.5, cy, 2.81, 2.96, 2.96, `Alim. ${k + 1}`, "3×3 · brasa", c.tinta, c.teto);
  }
  const mesa = (cx: number, cy: number) => {
    const { g } = grupo(cx, cy, "+z", 1.9, 1.9, "praca");
    bloco(g, 1, 0.08, 1, COR.lona, 0, 0.76, 0);
    cil(g, 0.07, 0.74, COR.ferro, 0, 0.37, 0);
    for (const [sx, sz] of [[0.78, 0], [-0.78, 0], [0, 0.78], [0, -0.78]]) cil(g, 0.19, 0.44, 0xb8a888, sx, 0.22, sz);
  };
  for (const y of [22.6, 24.9, 27.2, 29.5]) for (const x of [4.9, 7.3]) mesa(x, y);
  mesa(1.4, 38.3);
  mesa(3.7, 38.3);
  placa(4.6, 20.95, 0.1, 8.4, 0.62, "PRAÇA DE ALIMENTAÇÃO", "", "#ffc08a");
  placa(6.1, 31.05, 0.1, 4.6, 0.46, "10 mesas com 4 cadeiras", "", "#ffc08a", null, 0, 600);
  luz(cena, 0xff8a3a, 24, P(5, 26).x, 3.8, P(5, 26).z, 14);

  /* ── dois bares de 4 × 4 m, com balcão em volta e torre central ── */
  (
    [
      ["BAR 1", 6.5, 34],
      ["BAR 2", 24.4, 19],
    ] as const
  ).forEach(([nome, cx, cy]) => {
    const { g } = grupo(cx, cy, "+z", 4, 4, "bares");
    const c = PAL.bar;
    for (const s of [-1, 1]) {
      bloco(g, 4, 1.05, 0.5, COR.madeira, 0, 0.52, s * 1.75);
      bloco(g, 0.5, 1.05, 3, COR.madeira, s * 1.75, 0.52, 0);
      bloco(g, 4.1, 0.08, 0.6, c.faixa, 0, 1.08, s * 1.75);
      bloco(g, 0.6, 0.08, 3.1, c.faixa, s * 1.75, 1.08, 0);
    }
    bloco(g, 1.3, 2.9, 1.3, COR.ferro, 0, 1.45, 0);
    bloco(g, 1.36, 0.3, 1.36, COR.ambar, 0, 2.45, 0, 1.7);
    bloco(g, 4.2, 0.16, 4.2, hex(c.teto), 0, 3, 0);
    for (const sx of [-2, 2]) for (const sz of [-2, 2]) bloco(g, 0.1, 3, 0.1, COR.ferro, sx, 1.5, sz);
    placa(cx, cy, 3.1, 4.16, 4.16, nome, "4×4 · balcão em volta", c.tinta, c.teto);
  });

  /* ── espaço instagramável: cenografia de 5 × 2 m, com área livre na frente para as fotos ── */
  {
    const { g } = grupo(14, 29.4, "+z", 5, 2, "insta");
    bloco(g, 5, 0.22, 2, 0x2b211b, 0, 0.11, 0);
    bloco(g, 5, 3.4, 0.36, 0x241812, 0, 1.7, -0.8);
    bloco(g, 4.4, 0.14, 0.08, COR.brasa, 0, 3, -0.6, 2.2);
    bloco(g, 4.4, 0.14, 0.08, COR.brasa, 0, 0.6, -0.6, 2.2);
    bloco(g, 0.14, 2.4, 0.08, COR.brasa, -2.2, 1.8, -0.6, 2.2);
    bloco(g, 0.14, 2.4, 0.08, COR.brasa, 2.2, 1.8, -0.6, 2.2);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.07, 8, 32), mat(COR.ambar, 2.4));
    aro.position.set(0, 1.8, -0.58);
    g.add(aro);
    luz(g, 0xff9a3a, 18, 0, 2, 2, 10);
    placa(14, 29.85, 0.24, 4.7, 1.1, "INSTAGRAMÁVEL", "cenografia · 5×2 m", "#ffffff");
    placa(14, 32.2, 0.1, 5.4, 0.5, "espaço livre para as fotos", "", "#e9c98f", null, 0, 600);
  }

  /* ── podcast: aquário de vidro de 4 × 4 m, visível de quem entra ── */
  {
    const { g } = grupo(22.4, 36, "+z", 4, 4, "podcast");
    const c = PAL.podcast;
    bloco(g, 4, 0.2, 4, COR.madeiraEscura, 0, 0.1, 0);
    bloco(g, 3.8, 2.5, 3.8, 0x9fd0ff, 0, 1.45, 0, 0, 0.16);
    bloco(g, 4.1, 0.16, 4.1, c.faixa, 0, 2.78, 0);
    for (const sx of [-1.95, 1.95]) for (const sz of [-1.95, 1.95]) bloco(g, 0.12, 2.6, 0.12, COR.ferro, sx, 1.5, sz);
    cil(g, 0.9, 0.12, COR.madeira, 0, 0.98, 0);
    cil(g, 0.12, 0.86, COR.ferro, 0, 0.53, 0);
    for (const sx of [-0.55, 0.55]) {
      cil(g, 0.03, 0.45, COR.aco, sx, 1.26, 0);
      add(g, esfG, mat(COR.ferro), sx, 1.54, 0, 0.11, 0.14, 0.11);
      cil(g, 0.24, 0.5, COR.madeiraEscura, sx * 2.4, 0.45, 0);
    }
    bloco(g, 1.4, 0.36, 0.08, COR.vermelho, 0, 3.1, 2, 1.8);
    luz(g, 0xff5a4a, 12, 0, 2.2, 0, 9);
    placa(22.4, 36, 2.88, 4.06, 4.06, "PODCAST", "aquário 4×4", c.tinta, c.teto);
  }

  /* ── entrada de 20 m: pórtico cenográfico colado na tenda e o credenciamento ao lado ── */
  {
    const { g } = grupo(15, 40.7, "+z", 16, 1.2, "entrada");
    for (const sx of [-7.5, 7.5]) bloco(g, 1.1, 6, 1, 0x2a1d15, sx, 3, 0);
    bloco(g, 16.1, 1.7, 1, 0x2a1d15, 0, 6.3, 0);
    bloco(g, 11, 0.9, 0.08, COR.brasa, 0, 6.3, 0.54, 1.6);
    bloco(g, 0.16, 5, 0.08, COR.ambar, -6.9, 2.8, 0.54, 1.4);
    bloco(g, 0.16, 5, 0.08, COR.ambar, 6.9, 2.8, 0.54, 1.4);
    luz(g, 0xff8a2a, 30, 0, 4, 3, 16);
    placa(15, 40.7, 7.17, 15.6, 0.9, "PÓRTICO CENOGRÁFICO · colado na tenda", "", "#f7f1e9", "#2a1d15", 0, 700);
    const { g: c } = grupo(25.4, 41, "+z", 4, 1.6, "entrada");
    bloco(c, 4, 1.05, 1.2, PAL.credenciamento.faixa, 0, 0.52, 0);
    bloco(c, 4.2, 0.14, 1.6, hex(PAL.credenciamento.teto), 0, 2.5, 0);
    for (const sx of [-1.95, 1.95]) bloco(c, 0.08, 2.5, 0.08, COR.ferro, sx, 1.25, 0.6);
    placa(25.4, 41, 2.58, 4.16, 1.56, "Credenciamento", "", PAL.credenciamento.tinta, PAL.credenciamento.teto);
  }

  /* ── do lado de fora: banheiros (contêineres), gerador e ambulância ── */
  const infra = (nome: string, sub: string, cx: number, cy: number, w: number, d: number, alt: number, cor: number) => {
    const { g } = grupo(cx, cy, "+z", w, d);
    bloco(g, w, alt, d, cor, 0, alt / 2, 0);
    bloco(g, w + 0.1, 0.1, d + 0.1, PAL.infra.faixa, 0, alt + 0.05, 0);
    placa(cx, cy, alt + 0.12, w, d, nome, sub, PAL.infra.tinta, PAL.infra.teto);
    return g;
  };
  for (const [nome, cy] of [
    ["WC masc.", 25],
    ["WC fem.", 33],
  ] as const) {
    const g = infra(nome, "contêiner", -4.4, cy, 3, 6, 2.6, 0x8b929d);
    bloco(g, 0.06, 1.9, 0.9, COR.lona, 1.52, 0.95, -1.4);
    bloco(g, 0.06, 1.9, 0.9, COR.lona, 1.52, 0.95, 1.4);
  }
  infra("Gerador", "isolado", 35, 2.2, 4, 2.5, 1.9, 0x7f8691);
  {
    const g = infra("Ambulância", "UTI tipo D", 35.1, 35, 2.5, 6, 2.3, 0xe9e6e0);
    bloco(g, 2.54, 0.4, 6.04, COR.vermelho, 0, 1.1, 0);
    bloco(g, 2.3, 0.9, 0.06, 0x20262e, 0, 1.75, 3.01);
    bloco(g, 0.5, 0.18, 0.3, COR.vermelho, 0, 2.45, 2.2, 2);
  }

  /* ── estacionamento na frente: alguns carros, para situar a entrada ── */
  [
    [4, 48, 0x8a2f24],
    [9.5, 48.7, 0xd9d2c8],
    [20, 48.3, 0x3b556b],
    [25.5, 48.9, 0x2f2a27],
    [31, 48.1, 0xb5863a],
  ].forEach(([x, y, cor]) => {
    const p = P(x, y);
    bloco(cena, 1.9, 0.75, 4.2, cor, p.x, 0.6, p.z);
    bloco(cena, 1.7, 0.6, 2.2, 0x1c1c1c, p.x, 1.25, p.z + 0.2);
  });
  placa(15, 44.6, 0.08, 16, 1.5, "↓  ESTACIONAMENTO  ↓", "", "#d9cbbb");

  /* ── árvores nas bordas do terreno ── */
  const copaG = new THREE.ConeGeometry(1, 1, 7);
  [
    [-10.5, -4], [-10.5, 9], [-11, 31], [-10.5, 44], [1, -6.5], [29, -6.5], [39.5, -5],
    [40.5, 9], [40.5, 19], [40.5, 27], [40, 44], [-9, 51], [39, 51.5],
  ].forEach(([x, y], i) => {
    const p = P(x, y);
    const h = 2.2 + ((i * 7) % 5) * 0.24;
    cil(cena, 0.2, 1.4, COR.madeiraEscura, p.x, 0.7, p.z);
    add(cena, copaG, mat(COR.verde), p.x, 1.4 + h * 0.6, p.z, 1.5, h * 1.2, 1.5);
    add(cena, copaG, mat(0x2f5637), p.x, 2.1 + h, p.z, 1.05, h * 0.9, 1.05);
  });

  /* ── público: bonequinhos nos corredores (e alguns chegando), para dar escala e vida ── */
  {
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    const cores = [0xd9c7b0, 0xb5532a, 0x3b556b, 0xe0a04a, 0x6b4a8a, 0x2f2a27, 0xa33b2e];
    const pontos: [number, number, number][] = [];
    let tentativas = 0;
    while (pontos.length < 82 && tentativas++ < 4000) {
      const fora = pontos.length >= 72;
      const x = fora ? 6 + rnd() * 18 : 0.7 + rnd() * 28.6;
      const y = fora ? 42 + rnd() * 1.6 : 5.8 + rnd() * 33.6;
      if (ocupado.some(([x0, y0, x1, y1]) => x > x0 - 0.45 && x < x1 + 0.45 && y > y0 - 0.45 && y < y1 + 0.45)) continue;
      pontos.push([x, y, 0.92 + rnd() * 0.2]);
    }
    const corpos = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.19, 0.27, 0.92, 8), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), pontos.length);
    const cabecas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.19, 8, 6), new THREE.MeshStandardMaterial({ color: 0xc99a76, roughness: 0.9, flatShading: true }), pontos.length);
    const m4 = new THREE.Matrix4();
    const cor = new THREE.Color();
    pontos.forEach(([x, y, e], i) => {
      const p = P(x, y);
      m4.makeScale(e, e, e).setPosition(p.x, 0.5 * e, p.z);
      corpos.setMatrixAt(i, m4);
      corpos.setColorAt(i, cor.setHex(cores[i % cores.length]));
      m4.makeScale(e, e, e).setPosition(p.x, 1.16 * e, p.z);
      cabecas.setMatrixAt(i, m4);
    });
    cena.add(corpos, cabecas);
  }

  /* ── faíscas subindo da fogueira da arena ── */
  const NF = 46;
  const fPos = new Float32Array(NF * 3);
  const fVel = new Float32Array(NF);
  const fVida = new Float32Array(NF);
  const nasce = (i: number, cedo = false) => {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.8;
    fPos[i * 3] = fogo.x + Math.sin(a) * r;
    fPos[i * 3 + 1] = 0.5 + (cedo ? Math.random() * 3.4 : 0);
    fPos[i * 3 + 2] = fogo.z + 0.15 + Math.cos(a) * r;
    fVel[i] = 1 + Math.random() * 1.8;
    fVida[i] = 3.4 + Math.random() * 1.8;
  };
  for (let i = 0; i < NF; i++) nasce(i, true);
  const fGeo = new THREE.BufferGeometry();
  fGeo.setAttribute("position", new THREE.BufferAttribute(fPos, 3));
  const faiscas = new THREE.Points(fGeo, new THREE.PointsMaterial({ color: 0xffb04a, size: 0.24, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  cena.add(faiscas);

  /* ── câmera ── */
  let retrato = false;
  const geral = () => ({ az: 0.22, pol: 0.74, raio: retrato ? 104 : 70, alvo: new THREE.Vector3(0, 1.5, 3) });
  const c = { az: -0.5, pol: 0.25, raio: 170, alvo: new THREE.Vector3(0, 1.5, 3) };
  let t = geral();
  let foco: string | null = null;
  let arrastando = false;
  let parado = 0;
  let sentido = -1;

  const focar = (id: string | null) => {
    foco = id;
    for (const [k, hs] of halos) for (const h of hs) (h.material as THREE.MeshBasicMaterial).opacity = k === id ? 0.95 : 0;
    const z = ZONAS.find((q) => q.id === id);
    if (!z) {
      /* de volta à vista geral: mantém o ângulo em que a pessoa está, já dentro de uma volta */
      c.az = Math.atan2(Math.sin(c.az), Math.cos(c.az));
      const g = geral();
      g.az = c.az;
      t = g;
      return;
    }
    const az = z.az + Math.round((c.az - z.az) / (Math.PI * 2)) * Math.PI * 2;
    t = { az, pol: 0.84, raio: z.raio * (retrato ? 1.2 : 1), alvo: new THREE.Vector3(z.x, 1.6, z.z) };
  };

  /* ── arrastar para girar; toque simples escolhe o espaço ── */
  const raio = new THREE.Raycaster();
  const ponto = new THREE.Vector2();
  let x0 = 0;
  let xAnt = 0;
  let andou = 0;
  const baixo = (e: PointerEvent) => {
    arrastando = true;
    x0 = xAnt = e.clientX;
    andou = 0;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (!arrastando) return;
    const dx = e.clientX - xAnt;
    xAnt = e.clientX;
    andou = Math.max(andou, Math.abs(e.clientX - x0));
    t.az -= dx * 0.0075;
    parado = 0;
  };
  const cima = (e: PointerEvent) => {
    if (!arrastando) return;
    arrastando = false;
    if (andou > 7) return;
    const r = canvas.getBoundingClientRect();
    ponto.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raio.setFromCamera(ponto, camera);
    for (const hit of raio.intersectObjects(cena.children, true)) {
      let o: THREE.Object3D | null = hit.object;
      while (o && !o.userData.zona) o = o.parent;
      if (o) {
        aoEscolher(o.userData.zona as string);
        return;
      }
    }
  };
  const solta = () => (arrastando = false);
  canvas.addEventListener("pointerdown", baixo);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", cima);
  canvas.addEventListener("pointercancel", solta);

  /* ── tamanho ── */
  const medir = () => {
    const w = Math.max(1, caixa.clientWidth);
    const h = Math.max(1, caixa.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const antes = retrato;
    retrato = w / h < 1.05;
    if (antes !== retrato) focar(foco);
  };
  const ro = new ResizeObserver(medir);
  ro.observe(caixa);
  medir();
  t = geral();

  /* ── quadro a quadro ── */
  const v = new THREE.Vector3();
  let ligado = false;
  let raf = 0;
  let antes = 0;
  const quadro = (agora: number) => {
    raf = ligado ? requestAnimationFrame(quadro) : 0;
    const dt = Math.min(0.05, (agora - antes) / 1000 || 0.016);
    antes = agora;
    const seg = agora / 1000;

    parado += dt;
    /* vista geral: balança devagar entre os dois lados da frente; depois de um giro com o dedo, volta aos poucos */
    if (!foco && !arrastando && !calmo && parado > 1.6) {
      if (Math.abs(t.az) > Math.PI) {
        const volta = Math.sign(t.az) * Math.PI * 2;
        t.az -= volta;
        c.az -= volta;
      }
      if (t.az > 0.36) sentido = -1;
      else if (t.az < -0.36) sentido = 1;
      t.az += sentido * dt * (Math.abs(t.az) > 0.5 ? 0.22 : 0.035);
    }
    const k = 1 - Math.exp(-dt * (arrastando ? 14 : 3));
    c.az += (t.az - c.az) * k;
    c.pol += (t.pol - c.pol) * k;
    c.raio += (t.raio - c.raio) * k;
    c.alvo.lerp(t.alvo, k);
    camera.position.set(c.alvo.x + c.raio * Math.sin(c.pol) * Math.sin(c.az), c.alvo.y + c.raio * Math.cos(c.pol), c.alvo.z + c.raio * Math.sin(c.pol) * Math.cos(c.az));
    camera.lookAt(c.alvo);

    if (!calmo) {
      brasaLuz.intensity = 46 + Math.sin(seg * 9) * 6 + Math.sin(seg * 23) * 4;
      for (let i = 0; i < NF; i++) {
        fPos[i * 3 + 1] += fVel[i] * dt;
        fPos[i * 3] += Math.sin(seg * 2 + i) * dt * 0.25;
        if (fPos[i * 3 + 1] > fVida[i] + 1) nasce(i);
      }
      fGeo.attributes.position.needsUpdate = true;
      const pulso = 0.75 + Math.sin(seg * 3.2) * 0.2;
      if (foco) for (const h of halos.get(foco) ?? []) (h.material as THREE.MeshBasicMaterial).opacity = pulso;
    }

    renderer.render(cena, camera);

    /* marcadores em HTML acompanham os espaços */
    const w = caixa.clientWidth;
    const h = caixa.clientHeight;
    for (const z of ZONAS) {
      const el = pinos[z.id];
      if (!el) continue;
      v.set(z.x, z.alt, z.z).project(camera);
      const fora = v.z > 1 || Math.abs(v.x) > 1.08 || Math.abs(v.y) > 1.08;
      el.style.opacity = fora ? "0" : "1";
      el.style.pointerEvents = fora ? "none" : "auto";
      el.style.transform = `translate3d(${((v.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * h).toFixed(1)}px, 0) translate(-50%, -100%)`;
      el.style.zIndex = String(Math.round((1 - v.z) * 1000));
    }
  };

  return {
    focar: (id) => {
      parado = 0;
      focar(id);
    },
    ativo: (on) => {
      if (on === ligado) return;
      ligado = on;
      if (on) {
        antes = performance.now();
        raf = requestAnimationFrame(quadro);
      } else cancelAnimationFrame(raf);
    },
    destruir: () => {
      ligado = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", baixo);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", cima);
      canvas.removeEventListener("pointercancel", solta);
      cena.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mm = m.material as (THREE.Material & { map?: THREE.Texture | null }) | THREE.Material[] | undefined;
        if (Array.isArray(mm)) mm.forEach((q) => q.dispose());
        else {
          mm?.map?.dispose();
          mm?.dispose?.();
        }
      });
      renderer.dispose();
    },
  };
}
