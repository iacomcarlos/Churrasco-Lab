import * as THREE from "three";

/**
 * O evento em 3D, montado a partir da PLANTA BAIXA PRELIMINAR (versão 6) enviada pela organização
 * em 27/11/2026: tenda galpão de 30 × 40 m, com a entrada de 20 m voltada para o estacionamento.
 * As medidas e posições abaixo saem da planta (em metros). Formas simples, sem modelos prontos.
 * Fica num arquivo separado para o navegador só baixar o 3D quando o mapa estiver chegando na tela.
 *
 * Planta → cena: x da planta (0 a 30, da esquerda para a direita) vira x - 15;
 * y da planta (0 no fundo/backstage, 40 na entrada) vira z = y - 20. A entrada fica virada para a câmera.
 *
 * Câmera: gira em volta de um alvo. Sem espaço escolhido, mostra a tenda inteira girando devagar;
 * com um espaço escolhido, voa até ele. Arrastar para os lados gira a cena.
 */

/** `az` = de onde a câmera olha o espaço (0 = do lado da entrada); `raio` = distância. */
export type Zona = { id: string; x: number; z: number; alt: number; az: number; raio: number; halo: number };

const P = (x: number, y: number) => ({ x: x - 15, z: y - 20 });

export const ZONAS: Zona[] = [
  { id: "palco", ...P(14.9, 9.5), alt: 7.4, az: 0.38, raio: 27, halo: 5.6 },
  { id: "arena", ...P(24.65, 13), alt: 4.4, az: -0.62, raio: 19, halo: 4.3 },
  { id: "churrasco", ...P(7, 11.8), alt: 4.6, az: 0.55, raio: 27, halo: 4.6 },
  { id: "solidaria", ...P(22.4, 27.5), alt: 4.6, az: -0.72, raio: 25, halo: 5.2 },
  { id: "praca", ...P(4.6, 26.2), alt: 4.6, az: 0.3, raio: 27, halo: 5 },
  { id: "bares", ...P(24.4, 19), alt: 4.6, az: -0.5, raio: 17, halo: 3.1 },
  { id: "podcast", ...P(22.4, 36), alt: 4.6, az: -0.42, raio: 16, halo: 3.1 },
  { id: "insta", ...P(14, 30), alt: 5, az: 0.3, raio: 17, halo: 3.4 },
  { id: "entrada", ...P(15, 40.8), alt: 7.6, az: 0.28, raio: 26, halo: 0 },
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
  azul: 0x2f66b3,
  amarelo: 0xf2d21f,
  verde: 0x27452d,
  vermelho: 0xd8342a,
  roxo: 0x8f76c9,
  apoio: 0x5a6a85,
  cinza: 0x6f7782,
};

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
}): Cena {
  const { canvas, caixa, pinos, aoEscolher, calmo } = opts;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;

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
  /* pirâmide de base 1 × 1 e altura 1 (teto das barracas) */
  const tetoG = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4);
  tetoG.rotateY(Math.PI / 4);

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
    return g;
  };

  /* ── luz geral: fim de tarde quente ── */
  cena.add(new THREE.HemisphereLight(0xffe2c4, 0x3a2416, 2.1));
  const sol = new THREE.DirectionalLight(0xffcf9a, 2.5);
  sol.position.set(14, 26, 22);
  cena.add(sol);

  /* ── terreno, piso da tenda e as faixas de cada setor ── */
  bloco(cena, 50, 0.7, 60, COR.chao, 0, -0.36, 3);
  bloco(cena, 30, 0.06, 40, COR.piso, 0, 0.03, 0);
  const faixa = (x0: number, y0: number, x1: number, y1: number, cor: number, forca: number) => {
    const m = new THREE.Mesh(caixaG, new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: forca, depthWrite: false }));
    const p = P((x0 + x1) / 2, (y0 + y1) / 2);
    m.position.set(p.x, 0.075, p.z);
    m.scale.set(x1 - x0, 0.02, y1 - y0);
    cena.add(m);
  };
  faixa(0, 0, 10, 19.6, COR.brasa, 0.1); // setor churrasco
  faixa(0, 20.4, 9.2, 40, 0xff6a1a, 0.16); // praça de alimentação
  faixa(19, 20.4, 30, 38.2, COR.azul, 0.16); // economia solidária

  /* ── estrutura da tenda galpão: pilares, vigas e a cumeeira (sem a lona, para ver dentro) ── */
  {
    const alt = 5.4;
    const cume = 8.2;
    for (const y of [0, 10, 20, 30, 40]) {
      for (const x of [0, 30]) bloco(cena, 0.24, alt, 0.24, COR.estrutura, P(x, y).x, alt / 2, P(x, y).z);
      const comp = Math.hypot(15, cume - alt);
      const ang = Math.atan2(cume - alt, 15);
      const e = bloco(cena, comp, 0.12, 0.12, COR.estrutura, -7.5, (alt + cume) / 2, P(0, y).z, 0, 0.35);
      e.rotation.z = ang;
      const d = bloco(cena, comp, 0.12, 0.12, COR.estrutura, 7.5, (alt + cume) / 2, P(0, y).z, 0, 0.35);
      d.rotation.z = -ang;
    }
    for (const x of [0, 30]) bloco(cena, 0.12, 0.12, 40, COR.estrutura, P(x, 0).x, alt, 0, 0, 0.35);
    bloco(cena, 0.12, 0.12, 40, COR.estrutura, 0, cume, 0, 0, 0.35);
    /* lona do fundo e das laterais, bem transparente */
    bloco(cena, 30, alt, 0.06, COR.lona, 0, alt / 2, -20, 0, 0.13);
    for (const x of [0, 30]) bloco(cena, 0.06, alt, 40, COR.lona, P(x, 0).x, alt / 2, 0, 0, 0.07);
  }

  /* ── halos no chão: marcam os espaços; o escolhido acende ── */
  const halos = new Map<string, THREE.Mesh[]>();
  const halo = (id: string, x: number, z: number, r: number) => {
    const h = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.26, 56), new THREE.MeshBasicMaterial({ color: COR.brasa, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }));
    h.rotation.x = -Math.PI / 2;
    h.position.set(x, 0.1, z);
    cena.add(h);
    halos.set(id, [...(halos.get(id) ?? []), h]);
  };
  for (const z of ZONAS) if (z.halo) halo(z.id, z.x, z.z, z.halo);
  halo("bares", P(6.5, 34).x, P(6.5, 34).z, 3.1); // o segundo bar

  /* ── backstage: dois apoios, camarim e cozinha (4 × 4 cada), acesso restrito ── */
  [9, 13, 17, 21].forEach((x) => {
    const g = grupo(x, 2, "+z", 4, 4);
    bloco(g, 3.86, 2.8, 3.86, COR.apoio, 0, 1.4, 0);
    bloco(g, 3.96, 0.14, 3.96, COR.ferro, 0, 2.87, 0);
  });

  /* ── palco 8 × 6 m (aulas-show e painéis) e a plateia de 54 lugares ── */
  {
    const g = grupo(14.9, 8.5, "+z", 8, 6, "palco");
    bloco(g, 8, 0.7, 6, 0x3a2a22, 0, 0.35, 0);
    bloco(g, 8, 4.2, 0.2, COR.ferro, 0, 2.8, -2.9);
    bloco(g, 5.6, 1.3, 0.06, COR.brasa, 0, 3.6, -2.78, 0.9);
    bloco(g, 8.5, 0.26, 6.4, COR.ferro, 0, 5.1, 0);
    for (const sx of [-3.85, 3.85]) for (const sz of [-2.8, 2.8]) bloco(g, 0.2, 4.6, 0.2, COR.ferro, sx, 2.9, sz);
    bloco(g, 3.4, 0.9, 0.9, COR.aco, -0.8, 1.15, 1.2);
    bloco(g, 1.2, 0.75, 0.8, COR.ferro, 2.4, 1.08, 1.2);
    bloco(g, 1.05, 0.06, 0.65, COR.brasa, 2.4, 1.48, 1.2, 1.6);
    luz(g, 0xff8a2a, 40, 0, 4, 2);

    ocupado.push([10.9, 13, 20, 19.9]);
    const cadeiras = new THREE.InstancedMesh(caixaG, mat(COR.lona), 54);
    const m4 = new THREE.Matrix4();
    for (let f = 0; f < 6; f++)
      for (let c = 0; c < 9; c++) {
        const p = P(11.5 + c * 1, 13.7 + f * 1.05);
        m4.makeScale(0.5, 0.5, 0.5).setPosition(p.x, 0.3, p.z);
        cadeiras.setMatrixAt(f * 9 + c, m4);
      }
    cadeiras.userData.zona = "palco";
    cena.add(cadeiras);
  }

  /* ── camarote (tablado elevado e aberto, ao lado do backstage) ── */
  {
    const g = grupo(26.65, 6.75, "+z", 6.5, 4.5);
    bloco(g, 6.5, 0.6, 4.5, COR.madeiraEscura, 0, 0.3, 0);
    bloco(g, 6.5, 0.1, 0.1, COR.roxo, 0, 1.6, 2.2, 0.5);
    bloco(g, 6.5, 0.1, 0.1, COR.roxo, 0, 1.6, -2.2, 0.5);
    bloco(g, 0.1, 0.1, 4.5, COR.roxo, -3.2, 1.6, 0, 0.5);
    for (const sx of [-3.2, -1.6, 0, 1.6, 3.2]) bloco(g, 0.08, 1, 0.08, COR.ferro, sx, 1.1, 2.2);
    for (const sx of [-1.6, 1.4]) {
      cil(g, 0.45, 0.06, COR.madeira, sx, 1.7, 0);
      cil(g, 0.06, 1.1, COR.ferro, sx, 1.15, 0);
    }
  }

  /* ── arena do fogo de chão (6,5 × 5 m): gradil, fogueira e as carnes em volta ── */
  const fogo = P(24.65, 13);
  const brasaLuz = (() => {
    const g = grupo(24.65, 13, "+z", 6.5, 5, "arena");
    for (const y of [0.55, 1]) {
      bloco(g, 6.5, 0.07, 0.07, COR.ferro, 0, y, 2.5);
      bloco(g, 6.5, 0.07, 0.07, COR.ferro, 0, y, -2.5);
      bloco(g, 0.07, 0.07, 5, COR.ferro, 3.25, y, 0);
      bloco(g, 0.07, 0.07, 5, COR.ferro, -3.25, y, 0);
    }
    for (const sx of [-3.25, -1.6, 0, 1.6, 3.25]) for (const sz of [-2.5, 2.5]) bloco(g, 0.09, 1.05, 0.09, COR.ferro, sx, 0.52, sz);
    cil(g, 1.25, 0.28, 0x3b2a22, 0, 0.14, 0);
    cil(g, 1.05, 0.06, COR.brasa, 0, 0.31, 0, 2.4);
    for (let i = 0; i < 3; i++) {
      const t = bloco(g, 1.5, 0.2, 0.22, 0x2a1a12, 0, 0.42, 0);
      t.rotation.y = (i * Math.PI) / 3;
    }
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3;
      const e = new THREE.Group();
      e.position.set(Math.sin(a) * 1.75, 0, Math.cos(a) * 1.75);
      e.rotation.y = a;
      g.add(e);
      const estaca = bloco(e, 0.06, 1.9, 0.06, COR.aco, 0, 0.9, -0.2);
      estaca.rotation.x = -0.32;
      const carne = bloco(e, 0.5, 0.8, 0.14, 0x8a3324, 0, 1.2, -0.32);
      carne.rotation.x = -0.32;
    }
    return luz(g, 0xff7a1a, 50, 0, 1.8, 0, 16);
  })();

  /* ── estandes: frente × fundo em metros, teto em pirâmide ── */
  const estande = (cx: number, cy: number, lado: Lado, fr: number, fu: number, corTeto: number, corFaixa: number, zona: string) => {
    const g = grupo(cx, cy, lado, fr, fu, zona);
    bloco(g, fr * 0.94, 2.1, 0.06, COR.lona, 0, 1.05, -fu / 2 + 0.06);
    bloco(g, fr * 0.9, 0.9, 0.5, COR.madeira, 0, 0.45, fu / 2 - 0.34);
    bloco(g, fr * 0.9, 0.1, 0.52, corFaixa, 0, 0.95, fu / 2 - 0.34);
    bloco(g, fr * 0.98, 0.2, fu * 0.98, corFaixa, 0, 2.25, 0);
    add(g, tetoG, mat(corTeto), 0, 2.75, 0, fr * 1.02, 0.8, fu * 1.02);
    return g;
  };
  /* setor churrasco: 15 expositores (C1 a C13, mais os dois duplos C14 e C15) */
  let n = 0;
  const churras = (cx: number, cy: number, lado: Lado, fr = 3, fu = 2) => {
    const par = n++ % 2 === 0;
    estande(cx, cy, lado, fr, fu, par ? COR.brasa : COR.lona, par ? COR.lona : COR.brasa, "churrasco");
  };
  for (let k = 0; k < 5; k++) churras(1, 1.5 + k * 3, "+x");
  for (const y0 of [5, 12.5])
    for (const dy of [1.5, 4.5]) {
      churras(6, y0 + dy, "-x");
      churras(8, y0 + dy, "+x");
    }
  churras(13.5, 22.9, "-z", 6, 2);
  churras(13.5, 25, "+z", 6, 2);
  luz(cena, 0xffb060, 22, P(4, 9).x, 3.6, P(4, 9).z, 14);

  /* economia solidária: 15 expositores (E1 a E6 na parede, duas ilhas de quatro e o E15 na entrada) */
  n = 0;
  const solid = (cx: number, cy: number, lado: Lado, fr = 3, fu = 2) => {
    const par = n++ % 2 === 0;
    estande(cx, cy, lado, fr, fu, par ? COR.azul : COR.amarelo, par ? COR.amarelo : COR.azul, "solidaria");
  };
  for (let k = 0; k < 6; k++) solid(29, 21.5 + k * 3, "-x");
  for (const y0 of [22.4, 28.4]) {
    for (const x of [20.9, 23.9]) {
      solid(x, y0 + 1, "-z");
      solid(x, y0 + 3.1, "+z");
    }
  }
  solid(26.4, 39, "-x", 2, 2.8);
  luz(cena, 0xffe9a0, 22, P(26.4, 27).x, 3.6, P(26.4, 27).z, 14);

  /* ── praça de alimentação: cinco pontos de 3 × 3 que assam na hora e dez mesas ── */
  for (let k = 0; k < 5; k++) {
    const g = grupo(1.5, 22.5 + k * 3, "+x", 3, 3, "praca");
    bloco(g, 2.9, 2.5, 0.08, COR.lona, 0, 1.25, -1.42);
    bloco(g, 0.08, 2.5, 2.9, COR.lona, -1.42, 1.25, 0);
    bloco(g, 0.08, 2.5, 2.9, COR.lona, 1.42, 1.25, 0);
    bloco(g, 3, 0.4, 0.12, COR.brasa, 0, 2.5, 1.44);
    bloco(g, 3, 0.1, 3, COR.lona, 0, 2.72, 0);
    bloco(g, 1.7, 0.8, 0.7, COR.ferro, 0.2, 0.4, 0.9);
    bloco(g, 1.55, 0.06, 0.55, COR.brasa, 0.2, 0.83, 0.9, 1.8);
  }
  const mesa = (cx: number, cy: number) => {
    const g = grupo(cx, cy, "+z", 1.9, 1.9, "praca");
    bloco(g, 1, 0.08, 1, COR.madeira, 0, 0.76, 0);
    cil(g, 0.07, 0.74, COR.ferro, 0, 0.37, 0);
    for (const [sx, sz] of [[0.78, 0], [-0.78, 0], [0, 0.78], [0, -0.78]]) cil(g, 0.19, 0.44, COR.madeiraEscura, sx, 0.22, sz);
  };
  for (const y of [22.6, 24.9, 27.2, 29.5]) for (const x of [4.9, 7.3]) mesa(x, y);
  mesa(1.4, 38.3);
  mesa(3.7, 38.3);
  luz(cena, 0xff8a3a, 26, P(5, 26).x, 3.6, P(5, 26).z, 14);

  /* ── dois bares de 4 × 4 m, com balcão em volta e torre central ── */
  for (const [cx, cy] of [
    [6.5, 34],
    [24.4, 19],
  ]) {
    const g = grupo(cx, cy, "+z", 4, 4, "bares");
    for (const s of [-1, 1]) {
      bloco(g, 4, 1.05, 0.5, COR.madeira, 0, 0.52, s * 1.75);
      bloco(g, 0.5, 1.05, 3, COR.madeira, s * 1.75, 0.52, 0);
      bloco(g, 4.1, 0.08, 0.6, COR.amarelo, 0, 1.08, s * 1.75);
      bloco(g, 0.6, 0.08, 3.1, COR.amarelo, s * 1.75, 1.08, 0);
    }
    bloco(g, 1.3, 2.9, 1.3, COR.ferro, 0, 1.45, 0);
    bloco(g, 1.36, 0.3, 1.36, COR.ambar, 0, 2.45, 0, 1.7);
    bloco(g, 4.2, 0.16, 4.2, COR.ferro, 0, 3, 0);
    for (const sx of [-2, 2]) for (const sz of [-2, 2]) bloco(g, 0.1, 3, 0.1, COR.ferro, sx, 1.5, sz);
  }

  /* ── espaço instagramável: cenografia de 5 × 2 m, com área livre na frente para as fotos ── */
  {
    const g = grupo(14, 29.4, "+z", 5, 2, "insta");
    bloco(g, 5, 3.4, 0.4, 0x241812, 0, 1.7, -0.5);
    bloco(g, 4.4, 0.14, 0.08, COR.brasa, 0, 3, -0.28, 2.2);
    bloco(g, 4.4, 0.14, 0.08, COR.brasa, 0, 0.5, -0.28, 2.2);
    bloco(g, 0.14, 2.5, 0.08, COR.brasa, -2.2, 1.75, -0.28, 2.2);
    bloco(g, 0.14, 2.5, 0.08, COR.brasa, 2.2, 1.75, -0.28, 2.2);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 8, 32), mat(COR.ambar, 2.4));
    aro.position.set(0, 1.75, -0.26);
    g.add(aro);
    luz(g, 0xff9a3a, 20, 0, 2, 2, 10);
  }

  /* ── podcast: aquário de vidro de 4 × 4 m, visível de quem entra ── */
  {
    const g = grupo(22.4, 36, "+z", 4, 4, "podcast");
    bloco(g, 4, 0.2, 4, COR.madeiraEscura, 0, 0.1, 0);
    bloco(g, 3.8, 2.5, 3.8, 0x9fd0ff, 0, 1.45, 0, 0, 0.16);
    bloco(g, 4.1, 0.16, 4.1, COR.ferro, 0, 2.78, 0);
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
  }

  /* ── entrada de 20 m: pórtico cenográfico colado na tenda e o credenciamento ao lado ── */
  {
    const g = grupo(15, 40.7, "+z", 16, 1.2, "entrada");
    for (const sx of [-7.5, 7.5]) bloco(g, 1.1, 6, 1, 0x2a1d15, sx, 3, 0);
    bloco(g, 16.1, 1.7, 1, 0x2a1d15, 0, 6.3, 0);
    bloco(g, 11, 0.9, 0.08, COR.brasa, 0, 6.3, 0.54, 1.6);
    bloco(g, 0.16, 5, 0.08, COR.ambar, -6.9, 2.8, 0.54, 1.4);
    bloco(g, 0.16, 5, 0.08, COR.ambar, 6.9, 2.8, 0.54, 1.4);
    luz(g, 0xff8a2a, 30, 0, 4, 3, 16);
    const c = grupo(25.4, 41, "+z", 4, 1.6, "entrada");
    bloco(c, 4, 1.05, 1.2, COR.roxo, 0, 0.52, 0);
    bloco(c, 4.2, 0.14, 1.6, COR.lona, 0, 2.5, 0);
    for (const sx of [-1.95, 1.95]) bloco(c, 0.08, 2.5, 0.08, COR.ferro, sx, 1.25, 0.6);
  }

  /* ── banheiros (contêineres) do lado de fora, à esquerda ── */
  for (const y of [25, 33]) {
    const g = grupo(-4.4, y, "+x", 6, 3);
    bloco(g, 6, 2.6, 2.9, COR.cinza, 0, 1.3, 0);
    bloco(g, 6.1, 0.12, 3, COR.ferro, 0, 2.66, 0);
    bloco(g, 0.9, 1.9, 0.06, COR.lona, -1.4, 0.95, 1.47);
    bloco(g, 0.9, 1.9, 0.06, COR.lona, 1.4, 0.95, 1.47);
  }

  /* ── estacionamento na frente: alguns carros, para situar a entrada ── */
  [
    [4, 47.5, 0x8a2f24],
    [9.5, 48.2, 0xd9d2c8],
    [20, 47.8, 0x3b556b],
    [25.5, 48.4, 0x2f2a27],
    [31, 47.6, 0xb5863a],
  ].forEach(([x, y, cor]) => {
    const p = P(x, y);
    bloco(cena, 1.9, 0.75, 4.2, cor, p.x, 0.6, p.z);
    bloco(cena, 1.7, 0.6, 2.2, 0x1c1c1c, p.x, 1.25, p.z + 0.2);
  });

  /* ── árvores nas bordas do terreno ── */
  const copaG = new THREE.ConeGeometry(1, 1, 7);
  [
    [-7, -3], [-8, 8], [-8, 18], [-7.5, 39], [4, -4], [15, -4.5], [27, -4],
    [37.5, -2], [38, 9], [37.5, 20], [38, 30], [37, 41], [-7, 47], [37, 49],
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
    while (pontos.length < 96 && tentativas++ < 4000) {
      const fora = pontos.length >= 84;
      const x = fora ? 6 + rnd() * 18 : 0.7 + rnd() * 28.6;
      const y = fora ? 42 + rnd() * 3.6 : 4.6 + rnd() * 35;
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
    const r = Math.random() * 0.9;
    fPos[i * 3] = fogo.x + Math.sin(a) * r;
    fPos[i * 3 + 1] = 0.5 + (cedo ? Math.random() * 3.4 : 0);
    fPos[i * 3 + 2] = fogo.z + Math.cos(a) * r;
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
  const geral = () => ({ az: 0.5, pol: 0.94, raio: retrato ? 100 : 60, alvo: new THREE.Vector3(0, 1.5, 1.5) });
  const c = { az: -0.6, pol: 0.3, raio: 170, alvo: new THREE.Vector3(0, 1.5, 2.5) };
  let t = geral();
  let foco: string | null = null;
  let arrastando = false;
  let parado = 0;

  const focar = (id: string | null) => {
    foco = id;
    for (const [k, hs] of halos) for (const h of hs) (h.material as THREE.MeshBasicMaterial).opacity = k === id ? 0.95 : 0.2;
    const z = ZONAS.find((q) => q.id === id);
    if (!z) {
      const g = geral();
      g.az = c.az;
      t = g;
      return;
    }
    const az = z.az + Math.round((c.az - z.az) / (Math.PI * 2)) * Math.PI * 2;
    t = { az, pol: 0.9, raio: z.raio * (retrato ? 1.42 : 1), alvo: new THREE.Vector3(z.x, 1.6, z.z) };
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
    if (!foco && !arrastando && !calmo && parado > 1.2) t.az += dt * 0.07;
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
        const mm = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mm)) mm.forEach((q) => q.dispose());
        else mm?.dispose?.();
      });
      renderer.dispose();
    },
  };
}
