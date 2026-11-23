import * as THREE from "three";

/**
 * A praça do evento em 3D (maquete ilustrativa, feita só com formas simples).
 * Fica num arquivo separado para o navegador só baixar o 3D quando o mapa estiver chegando na tela.
 *
 * Câmera: gira em volta de um alvo. Sem espaço escolhido, mostra a praça inteira girando devagar;
 * com um espaço escolhido, voa até ele. Arrastar para os lados gira a praça.
 */

export type Zona = { id: string; x: number; z: number; alt: number };

const R = 10.6;
const arco = (t: number) => [R * Math.sin(t), R * Math.cos(t)] as const;

/** Posição de cada espaço na maquete (x, z) e a altura do marcador. */
export const ZONAS: Zona[] = [
  { id: "palco", x: 0, z: -9.6, alt: 5.6 },
  { id: "paineis", x: -9.6, z: -3.4, alt: 3.9 },
  { id: "podcast", x: 9.6, z: -3.4, alt: 3.9 },
  { id: "churrasco", x: arco(-1.08)[0], z: arco(-1.08)[1], alt: 3.5 },
  { id: "solidaria", x: arco(1.08)[0], z: arco(1.08)[1], alt: 3.5 },
  { id: "praca", x: 0, z: 0, alt: 3.2 },
  { id: "shows", x: 0, z: 10.2, alt: 6.2 },
];

const COR = {
  chao: 0x2a1b12,
  chao2: 0x3a2618,
  madeira: 0x6b4426,
  madeiraEscura: 0x54361f,
  ferro: 0x4a4038,
  aco: 0x8c9196,
  lona: 0xf4ece2,
  brasa: 0xf47a12,
  ambar: 0xffab33,
  azul: 0x2f66b3,
  amarelo: 0xf2d21f,
  verde: 0x27452d,
  vermelho: 0xd8342a,
};

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
  const camera = new THREE.PerspectiveCamera(34, 1, 0.5, 200);

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
  const cilG = new THREE.CylinderGeometry(1, 1, 1, 20);
  const esfG = new THREE.SphereGeometry(1, 12, 10);
  const add = (pai: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    o.scale.set(sx, sy, sz);
    pai.add(o);
    return o;
  };
  const bloco = (pai: THREE.Object3D, w: number, h: number, d: number, cor: number, x: number, y: number, z: number, emissivo = 0, opacidade = 1) => add(pai, caixaG, mat(cor, emissivo, opacidade), x, y, z, w, h, d);
  const cil = (pai: THREE.Object3D, r: number, h: number, cor: number, x: number, y: number, z: number, emissivo = 0) => add(pai, cilG, mat(cor, emissivo), x, y, z, r, h, r);
  const luz = (pai: THREE.Object3D, cor: number, forca: number, x: number, y: number, z: number, alcance = 16) => {
    const l = new THREE.PointLight(cor, forca, alcance, 1.5);
    l.position.set(x, y, z);
    pai.add(l);
    return l;
  };
  /** Cria o grupo de um espaço, já virado para o centro da praça. */
  const grupos = new Map<string, THREE.Group>();
  const espaco = (id: string | null, x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = x === 0 && z === 0 ? 0 : Math.atan2(-x, -z);
    if (id) {
      g.userData.zona = id;
      grupos.set(id, g);
    }
    cena.add(g);
    return g;
  };

  /* ── luz geral: fim de tarde quente ── */
  cena.add(new THREE.HemisphereLight(0xffe2c4, 0x3a2416, 2.1));
  const sol = new THREE.DirectionalLight(0xffcf9a, 2.6);
  sol.position.set(9, 16, 11);
  cena.add(sol);

  /* ── chão da praça ── */
  add(cena, new THREE.CylinderGeometry(15.4, 16, 0.7, 56), mat(COR.chao), 0, -0.35, 0, 1, 1, 1);
  add(cena, new THREE.CylinderGeometry(13.2, 13.2, 0.04, 56), mat(COR.chao2), 0, 0.02, 0, 1, 1, 1);
  const anel = (r: number, forca: number) => {
    const a = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.09, 72), new THREE.MeshBasicMaterial({ color: COR.ambar, transparent: true, opacity: forca, side: THREE.DoubleSide }));
    a.rotation.x = -Math.PI / 2;
    a.position.y = 0.06;
    cena.add(a);
  };
  anel(5.4, 0.35);
  anel(13.1, 0.5);
  for (let i = 0; i < 4; i++) {
    const f = bloco(cena, 0.07, 0.02, 7.4, COR.ambar, 0, 0.06, 0, 0.5, 0.5);
    f.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;
    f.translateZ(9.3);
  }

  /* ── halos no chão: marcam os espaços; o escolhido acende ── */
  const halos = new Map<string, THREE.Mesh>();
  for (const z of ZONAS) {
    const h = new THREE.Mesh(new THREE.RingGeometry(z.id === "praca" ? 2.3 : 3.3, z.id === "praca" ? 2.55 : 3.55, 48), new THREE.MeshBasicMaterial({ color: COR.brasa, transparent: true, opacity: 0.18, side: THREE.DoubleSide }));
    h.rotation.x = -Math.PI / 2;
    h.position.set(z.x, 0.08, z.z);
    cena.add(h);
    halos.set(z.id, h);
  }

  /* ── palco das aulas-show ── */
  {
    const g = espaco("palco", 0, -9.6);
    bloco(g, 7.2, 0.5, 4, COR.madeiraEscura, 0, 0.25, 0);
    bloco(g, 7.2, 3.7, 0.2, COR.ferro, 0, 2.35, -1.9);
    bloco(g, 5.2, 1.15, 0.06, COR.brasa, 0, 3.05, -1.78, 0.9);
    bloco(g, 7.7, 0.25, 4.5, COR.ferro, 0, 4.35, 0);
    for (const sx of [-3.5, 3.5]) for (const sz of [-1.8, 1.8]) bloco(g, 0.18, 4.1, 0.18, COR.ferro, sx, 2.3, sz);
    bloco(g, 3.2, 0.9, 0.9, COR.aco, -0.6, 0.95, 0.5);
    bloco(g, 1.1, 0.75, 0.8, COR.ferro, 2.3, 0.88, 0.5);
    bloco(g, 0.95, 0.06, 0.65, COR.brasa, 2.3, 1.28, 0.5, 1.6);
    luz(g, 0xff8a2a, 34, 0, 3.4, 1.2);
  }

  /* ── painéis de conversa ── */
  {
    const g = espaco("paineis", -9.6, -3.4);
    bloco(g, 4.6, 0.3, 3, COR.madeiraEscura, 0, 0.15, 0);
    bloco(g, 4.6, 2.5, 0.15, COR.ferro, 0, 1.55, -1.4);
    bloco(g, 4.6, 0.22, 0.06, COR.ambar, 0, 2.5, -1.31, 0.9);
    for (const sx of [-1.3, 0, 1.3]) {
      bloco(g, 0.62, 0.42, 0.62, COR.lona, sx, 0.52, 0.1);
      bloco(g, 0.62, 0.7, 0.12, COR.lona, sx, 0.95, -0.2);
    }
    cil(g, 0.36, 0.5, COR.madeira, 0.65, 0.55, 0.85);
    luz(g, 0xffb060, 14, 0, 2.6, 1.4, 10);
  }

  /* ── estúdio de podcast ── */
  {
    const g = espaco("podcast", 9.6, -3.4);
    bloco(g, 3.7, 0.2, 3.3, COR.madeiraEscura, 0, 0.1, 0);
    bloco(g, 3.5, 2.4, 3.1, 0x9fd0ff, 0, 1.4, 0, 0, 0.16);
    bloco(g, 3.8, 0.16, 3.4, COR.ferro, 0, 2.7, 0);
    for (const sx of [-1.75, 1.75]) for (const sz of [-1.55, 1.55]) bloco(g, 0.12, 2.5, 0.12, COR.ferro, sx, 1.45, sz);
    cil(g, 0.85, 0.12, COR.madeira, 0, 0.95, 0);
    cil(g, 0.12, 0.85, COR.ferro, 0, 0.5, 0);
    for (const sx of [-0.5, 0.5]) {
      cil(g, 0.03, 0.45, COR.aco, sx, 1.22, 0);
      add(g, esfG, mat(COR.ferro), sx, 1.5, 0, 0.11, 0.14, 0.11);
    }
    bloco(g, 1.3, 0.36, 0.08, COR.vermelho, 0, 3.0, 1.6, 1.8);
    luz(g, 0xff5a4a, 10, 0, 2.2, 0, 9);
  }

  /* ── estandes: churrasco (laranja) e economia solidária (azul e amarelo) ── */
  const tendaG = new THREE.ConeGeometry(1.42, 0.95, 4);
  const estande = (x: number, z: number, corTeto: number, corFaixa: number) => {
    const g = espaco(null, x, z);
    bloco(g, 1.7, 0.85, 0.7, COR.madeira, 0, 0.43, 0.55);
    bloco(g, 1.7, 0.12, 0.72, corFaixa, 0, 0.92, 0.55);
    for (const sx of [-0.9, 0.9]) for (const sz of [-0.9, 0.9]) bloco(g, 0.07, 2, 0.07, COR.ferro, sx, 1, sz);
    const teto = add(g, tendaG, mat(corTeto), 0, 2.45, 0, 1, 1, 1);
    teto.rotation.y = Math.PI / 4;
    bloco(g, 1.95, 0.16, 1.95, corFaixa, 0, 2.02, 0);
    return g;
  };
  for (let k = 0; k < 5; k++) {
    const t = 0.7 + k * 0.19;
    const [x, z] = arco(-t);
    const a = estande(x, z, k % 2 ? COR.lona : COR.brasa, k % 2 ? COR.brasa : COR.lona);
    a.userData.zona = "churrasco";
    const [x2, z2] = arco(t);
    const b = estande(x2, z2, k % 2 ? COR.amarelo : COR.azul, k % 2 ? COR.azul : COR.amarelo);
    b.userData.zona = "solidaria";
  }
  luz(cena, 0xffb060, 16, arco(-1.08)[0] * 0.8, 3, arco(-1.08)[1] * 0.8, 11);
  luz(cena, 0xffe9a0, 16, arco(1.08)[0] * 0.8, 3, arco(1.08)[1] * 0.8, 11);

  /* ── praça de alimentação: a parrilla no centro ── */
  const brasaLuz = (() => {
    const g = espaco("praca", 0, 0);
    cil(g, 1.55, 0.85, 0x3b2a22, 0, 0.43, 0);
    cil(g, 1.36, 0.06, COR.brasa, 0, 0.88, 0, 2.2);
    for (let i = -2; i <= 2; i++) bloco(g, 2.6, 0.04, 0.05, COR.ferro, 0, 1.02, i * 0.42);
    for (const [sx, sz] of [[-0.5, -0.2], [0.35, 0.3], [0.1, -0.55]]) bloco(g, 0.6, 0.16, 0.36, 0x8a3324, sx, 1.12, sz);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.5;
      const mx = Math.sin(a) * 3.9;
      const mz = Math.cos(a) * 3.9;
      cil(g, 0.62, 0.08, COR.madeira, mx, 0.78, mz);
      cil(g, 0.08, 0.76, COR.ferro, mx, 0.38, mz);
      for (let j = 0; j < 3; j++) {
        const b = a + (j / 3) * Math.PI * 2;
        cil(g, 0.19, 0.42, COR.madeiraEscura, mx + Math.sin(b) * 0.95, 0.21, mz + Math.cos(b) * 0.95);
      }
    }
    return luz(g, 0xff7a1a, 46, 0, 1.9, 0, 15);
  })();

  /* ── shows locais + DJ ── */
  const feixes: THREE.Mesh[] = [];
  {
    const g = espaco("shows", 0, 10.2);
    bloco(g, 8.2, 0.7, 4.2, COR.madeiraEscura, 0, 0.35, 0);
    for (const sx of [-3.9, 3.9]) bloco(g, 0.3, 5, 0.3, COR.ferro, sx, 3.2, -1.7);
    bloco(g, 8.1, 0.3, 0.3, COR.ferro, 0, 5.6, -1.7);
    bloco(g, 7.6, 3.6, 0.12, 0x2a201a, 0, 3.0, -1.85);
    bloco(g, 5.6, 0.9, 0.06, COR.brasa, 0, 3.9, -1.76, 0.9);
    for (const sx of [-3.3, 3.3]) {
      bloco(g, 1.05, 1.2, 1, COR.ferro, sx, 1.3, 0.9);
      bloco(g, 1.05, 1.1, 1, 0x34302c, sx, 2.45, 0.9);
      cil(g, 0.34, 0.06, 0x111111, sx, 1.3, 1.43).rotation.x = Math.PI / 2;
    }
    bloco(g, 2.4, 1, 0.9, COR.ferro, 0, 1.2, 0.3);
    bloco(g, 2.4, 0.16, 0.06, COR.ambar, 0, 1.35, 0.77, 1.8);
    const feixeG = new THREE.ConeGeometry(1.5, 6.4, 20, 1, true);
    feixeG.translate(0, -3.2, 0);
    [-2.6, 0, 2.6].forEach((sx, i) => {
      const f = new THREE.Mesh(feixeG, new THREE.MeshBasicMaterial({ color: i === 1 ? COR.ambar : COR.brasa, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      f.position.set(sx, 5.5, -1.6);
      g.add(f);
      feixes.push(f);
    });
    luz(g, 0xffa040, 30, 0, 3.6, 1.6);
  }

  /* ── árvores na borda ── */
  const copaG = new THREE.ConeGeometry(1, 1, 7);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.26;
    if (Math.abs(Math.sin(a)) < 0.32) continue;
    const x = Math.sin(a) * 14.2;
    const z = Math.cos(a) * 14.2;
    const h = 1.5 + ((i * 7) % 5) * 0.16;
    cil(cena, 0.14, 1, COR.madeiraEscura, x, 0.5, z);
    add(cena, copaG, mat(COR.verde), x, 1 + h * 0.6, z, 1.05, h * 1.2, 1.05);
    add(cena, copaG, mat(0x2f5637), x, 1.5 + h, z, 0.75, h * 0.9, 0.75);
  }

  /* ── público: bonequinhos espalhados, para dar escala e vida ── */
  {
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    const cores = [0xd9c7b0, 0xb5532a, 0x3b556b, 0xe0a04a, 0x6b4a8a, 0x2f2a27, 0xa33b2e];
    const pontos: [number, number, number][] = [];
    while (pontos.length < 54) {
      const a = rnd() * Math.PI * 2;
      const r = 2.6 + rnd() * 9.6;
      const x = Math.sin(a) * r;
      const z = Math.cos(a) * r;
      if (ZONAS.some((zn) => zn.id !== "praca" && Math.hypot(zn.x - x, zn.z - z) < 3.1)) continue;
      if (r > 4.6 || r < 3.1) pontos.push([x, z, 0.9 + rnd() * 0.22]);
    }
    const corpos = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.21, 0.72, 8), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), pontos.length);
    const cabecas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshStandardMaterial({ color: 0xc99a76, roughness: 0.9, flatShading: true }), pontos.length);
    const m4 = new THREE.Matrix4();
    const cor = new THREE.Color();
    pontos.forEach(([x, z, e], i) => {
      m4.makeScale(e, e, e).setPosition(x, 0.38 * e, z);
      corpos.setMatrixAt(i, m4);
      corpos.setColorAt(i, cor.setHex(cores[i % cores.length]));
      m4.makeScale(e, e, e).setPosition(x, 0.9 * e, z);
      cabecas.setMatrixAt(i, m4);
    });
    cena.add(corpos, cabecas);
  }

  /* ── faíscas subindo da parrilla ── */
  const NF = 46;
  const fPos = new Float32Array(NF * 3);
  const fVel = new Float32Array(NF);
  const fVida = new Float32Array(NF);
  const nasce = (i: number, cedo = false) => {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 1.1;
    fPos[i * 3] = Math.sin(a) * r;
    fPos[i * 3 + 1] = 1 + (cedo ? Math.random() * 3 : 0);
    fPos[i * 3 + 2] = Math.cos(a) * r;
    fVel[i] = 0.9 + Math.random() * 1.6;
    fVida[i] = 3.2 + Math.random() * 1.6;
  };
  for (let i = 0; i < NF; i++) nasce(i, true);
  const fGeo = new THREE.BufferGeometry();
  fGeo.setAttribute("position", new THREE.BufferAttribute(fPos, 3));
  const faiscas = new THREE.Points(fGeo, new THREE.PointsMaterial({ color: 0xffb04a, size: 0.17, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  cena.add(faiscas);

  /* ── câmera ── */
  let retrato = false;
  const geral = () => ({ az: 0.55, pol: 0.98, raio: retrato ? 58 : 39, alvo: new THREE.Vector3(0, 1.2, 0) });
  const c = { az: -0.7, pol: 0.3, raio: 80, alvo: new THREE.Vector3(0, 1.2, 0) };
  let t = geral();
  let foco: string | null = null;
  let arrastando = false;
  let parado = 0;

  const focar = (id: string | null) => {
    foco = id;
    for (const [k, h] of halos) (h.material as THREE.MeshBasicMaterial).opacity = k === id ? 0.95 : 0.18;
    const z = ZONAS.find((q) => q.id === id);
    if (!z) {
      const g = geral();
      g.az = c.az;
      t = g;
      return;
    }
    const centro = z.x === 0 && z.z === 0;
    let az = centro ? c.az : Math.atan2(-z.x, -z.z) + 0.42;
    az += Math.round((c.az - az) / (Math.PI * 2)) * Math.PI * 2;
    t = { az, pol: 1.13, raio: (retrato ? 21 : 16.5) + (z.id === "shows" || z.id === "palco" ? 2.5 : 0), alvo: new THREE.Vector3(z.x * 0.94, 1.5, z.z * 0.94) };
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
    if (!foco && !arrastando && !calmo && parado > 1.2) t.az += dt * 0.085;
    const k = 1 - Math.exp(-dt * (arrastando ? 14 : 3));
    c.az += (t.az - c.az) * k;
    c.pol += (t.pol - c.pol) * k;
    c.raio += (t.raio - c.raio) * k;
    c.alvo.lerp(t.alvo, k);
    camera.position.set(c.alvo.x + c.raio * Math.sin(c.pol) * Math.sin(c.az), c.alvo.y + c.raio * Math.cos(c.pol), c.alvo.z + c.raio * Math.sin(c.pol) * Math.cos(c.az));
    camera.lookAt(c.alvo);

    if (!calmo) {
      brasaLuz.intensity = 42 + Math.sin(seg * 9) * 5 + Math.sin(seg * 23) * 3;
      feixes.forEach((f, i) => {
        f.rotation.z = Math.sin(seg * 0.8 + i * 2.1) * 0.5;
        f.rotation.x = 0.25 + Math.sin(seg * 0.6 + i) * 0.2;
      });
      for (let i = 0; i < NF; i++) {
        fPos[i * 3 + 1] += fVel[i] * dt;
        fPos[i * 3] += Math.sin(seg * 2 + i) * dt * 0.25;
        if (fPos[i * 3 + 1] > fVida[i] + 1) nasce(i);
      }
      fGeo.attributes.position.needsUpdate = true;
      const pulso = 0.75 + Math.sin(seg * 3.2) * 0.2;
      if (foco) (halos.get(foco)!.material as THREE.MeshBasicMaterial).opacity = pulso;
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
