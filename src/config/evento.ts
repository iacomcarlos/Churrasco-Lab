/**
 * CHURRASCO LAB BRASÍLIA 2026 · conteúdo oficial do site.
 * Tudo o que aparece na página sai deste arquivo: datas, local, programação,
 * profissionais e textos. Para atualizar, edite aqui e gere o site de novo.
 *
 * Regra: só informação confirmada pela organização. Campo sem dado fica vazio
 * e a interface esconde o elemento.
 */

/** Endereço oficial do site (domínio comprado pela organização). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://churrascolabbsb.com.br").replace(/\/$/, "");

export const evento = {
  nome: "Churrasco LAB Brasília 2026",
  nomeCurto: "Churrasco LAB Brasília",
  conceito: "Do fogo ao negócio",
  datasTexto: "27 e 28 de novembro",
  datasCurtas: "27 e 28 de nov",
  ano: 2026,
  inicio: "2026-11-27",
  fim: "2026-11-28",
  entrada: "Entrada gratuita",
  local: {
    nome: "Praça da Bíblia",
    bairro: "Ceilândia",
    uf: "Distrito Federal",
    ufSigla: "DF",
    /** Texto usado na busca do aplicativo de mapas (sem número, CEP ou complemento inventado). */
    buscaMapa: "Praça da Bíblia, Ceilândia, Brasília - DF",
  },
  titulo: "Churrasco LAB Brasília 2026 | 27 e 28 de Novembro",
  descricao:
    "O Churrasco LAB Brasília acontece nos dias 27 e 28 de novembro, na Praça da Bíblia, em Ceilândia. Entrada gratuita. Confira a programação das aulas-show.",
  /** Realização confirmada pela organização em 21/11/2026 (régua oficial enviada). */
  realizacao: { nome: "Humanidade Diversificada e Unida", sigla: "HDU" },
  parceria: { nome: "Secretaria de Desenvolvimento Econômico, Trabalho e Renda", governo: "GDF" },
  /** Título do bloco ("Apoio") escolhido por nós; troque aqui se a organização preferir outro. */
  apoio: { titulo: "Apoio", nome: "Fórum de Economia Solidária do Distrito Federal e Entorno (FESDFE)" },
} as const;

/* ───────────────── Profissionais ───────────────── */

export type Profissional = {
  id: string;
  /** Nome como aparece na programação oficial. */
  nome: string;
  /** Identificação associada (entre parênteses na programação). */
  marca?: string;
  /** Nome completo, quando informado no material enviado pelo próprio profissional. */
  nomeCompleto?: string;
  /** Foto oficial enviada pela organização (sem foto, o card é tipográfico). */
  foto?: string;
  fotoMini?: string;
  /** Ponto de foco da foto no recorte (CSS object-position). */
  foco?: string;
  /** Resumo extraído do currículo enviado. Sem currículo, fica vazio. */
  bio?: string[];
};

export const profissionais: Profissional[] = [
  {
    id: "jose",
    nome: "José",
    marca: "Molotov",
    nomeCompleto: "José Domingos de Aguiar",
    foto: "/profissionais/jose.webp",
    fotoMini: "/profissionais/jose-mini.webp",
    foco: "50% 12%",
    bio: [
      "Psicólogo de formação e cozinheiro autodidata desde 2018. Em 2019 entrou como sócio em uma hamburgueria e, em 2020, em um bar, onde passou a trabalhar com hambúrguer na brasa.",
      "Em 2023 fundou a Punk Pickles, primeira empresa de conservas de Brasília, e abriu a Mal Feito Lanches, especializada em smash burger (empresas das quais não faz mais parte).",
      "No fim de 2024 fundou a Molotov, especializada em chili oil, que no fim de 2025 virou também restaurante, onde serve hambúrguer na brasa. Participou de eventos como Brasas, Chefs do Fogo e Hamburgada Super Quadra Bar.",
    ],
  },
  {
    id: "jonathan",
    nome: "Jonathan Nobre",
    foto: "/profissionais/jonathan.webp",
    fotoMini: "/profissionais/jonathan-mini.webp",
    foco: "50% 12%",
    bio: [
      "Chef, empreendedor e gestor de restaurantes, com mais de 8 anos de experiência no Brasil e nos Estados Unidos.",
      "Fundador do Alecrim Smokehouse, em Brasília. Especialista em American BBQ, churrasco brasileiro e parrilla argentina, com experiência em gestão, desenvolvimento de negócios, controle de custos e liderança de equipes.",
    ],
  },
  {
    id: "jefferson",
    nome: "Jefferson",
    marca: "Braseiro 61",
    nomeCompleto: "Jefferson Faustino",
    foto: "/profissionais/jefferson.webp",
    fotoMini: "/profissionais/jefferson-mini.webp",
    foco: "50% 12%",
    bio: [
      "À frente do Braseiro61, une o domínio do fogo, a técnica do churrasco e a valorização das raízes da comida caipira.",
      "Em Brasília, atua também como churrasqueiro e mentor, formando novos profissionais em experiências práticas, workshops e vivências à beira do fogo.",
    ],
  },
  {
    id: "gabrielle",
    nome: "Gabrielle",
    marca: "Rusticano",
    foto: "/profissionais/gabrielle.webp",
    fotoMini: "/profissionais/gabrielle-mini.webp",
    foco: "50% 12%",
    bio: [
      "Formada em Administração de Empresas, decidiu empreender junto com o esposo e construir a própria hamburgueria do zero, mesmo sem recursos e sem experiência no ramo.",
      "Responsável pela administração do negócio, ajudou a estruturar, organizar e fazer crescer a empresa, que está em funcionamento há sete anos.",
    ],
  },
  {
    id: "pedro",
    nome: "Pedro",
    marca: "061 bbq",
    nomeCompleto: "Pedro Henrique",
    foto: "/profissionais/pedro.webp",
    fotoMini: "/profissionais/pedro-mini.webp",
    foco: "50% 12%",
    bio: [
      "Formado em Administração de Empresas, começou na cozinha em 2015. Em 2018 conheceu o American Barbecue, aprofundou os estudos e, no fim daquele ano, fundou o 061bbq junto com a esposa.",
      "Hoje tem um ponto de vendas de rua em Águas Claras, é sócio proprietário da unidade de Vicente Pires e participa de grandes eventos e serviços de buffet.",
    ],
  },
  {
    id: "andrey",
    nome: "Andrey Angelim",
    foto: "/profissionais/andrey.webp",
    fotoMini: "/profissionais/andrey-mini.webp",
    foco: "50% 12%",
    bio: [
      "Cozinheiro e chef de cozinha formado pelo IESB, em Brasília. São 10 anos de cozinha profissional, sempre com a carne no centro: churrasco, parrilla e cozinha de fogo.",
      "Desde 2021 está à frente da cozinha da Fazenda Churrascada Brasília. Também se dedica ao ensino, com aulas para iniciantes e profissionais, e à consultoria para restaurantes.",
    ],
  },
];

export const profissionalPorId = (id: string) => profissionais.find((p) => p.id === id)!;

/** "José (Molotov)", "Andrey Angelim" ... exatamente como na programação oficial. */
export const nomeNaProgramacao = (p: Profissional) => (p.marca ? `${p.nome} (${p.marca})` : p.nome);

/* ───────────────── Programação oficial das aulas-show ───────────────── */

export type Dia = { id: string; data: string; rotulo: string; semana: string; semanaCurta: string; diaMes: string };

export const dias: Dia[] = [
  { id: "sexta", data: "2026-11-27", rotulo: "27 NOV", semana: "Sexta-feira", semanaCurta: "Sexta", diaMes: "27/11" },
  { id: "sabado", data: "2026-11-28", rotulo: "28 NOV", semana: "Sábado", semanaCurta: "Sábado", diaMes: "28/11" },
];

export type Aula = {
  id: string;
  numero: number;
  /** Data no formato AAAA-MM-DD (horário de Brasília). */
  data: string;
  /** Horários no formato HH:MM (horário de Brasília). */
  inicio: string;
  fim: string;
  tema: string;
  profissional: string;
  /** Link de inscrição específico da aula, se um dia existir. Vazio = usa a inscrição geral do site. */
  linkInscricao?: string;
};

export const aulas: Aula[] = [
  { id: "burger", numero: 1, data: "2026-11-27", inicio: "18:30", fim: "19:45", tema: "Burger", profissional: "jose" },
  { id: "tendencias", numero: 2, data: "2026-11-27", inicio: "20:00", fim: "21:15", tema: "Tendências do mercado", profissional: "jonathan" },
  { id: "fogo-de-chao", numero: 3, data: "2026-11-28", inicio: "12:30", fim: "13:45", tema: "Fogo de chão", profissional: "jefferson" },
  { id: "empreendedorismo", numero: 4, data: "2026-11-28", inicio: "14:15", fim: "15:30", tema: "Empreendedorismo na gastronomia", profissional: "gabrielle" },
  { id: "defumacao", numero: 5, data: "2026-11-28", inicio: "16:00", fim: "17:15", tema: "Defumação", profissional: "pedro" },
  { id: "tecnicas-de-grelha", numero: 6, data: "2026-11-28", inicio: "17:45", fim: "19:00", tema: "Técnicas de grelha", profissional: "andrey" },
];

export const aulasDoDia = (data: string) => aulas.filter((a) => a.data === data);
export const aulaDoProfissional = (id: string) => aulas.find((a) => a.profissional === id);
export const diaDaAula = (a: Aula) => dias.find((d) => d.data === a.data)!;
export const dois = (n: number) => String(n).padStart(2, "0");
/** "18:30" → "18h30" */
export const hora = (h: string) => h.replace(":", "h");

/* ───────────────── Navegação e links ───────────────── */

export const menu = [
  { id: "aulas", texto: "Aulas-show" },
  { id: "local", texto: "Local" },
] as const;

const q = encodeURIComponent(evento.local.buscaMapa);
export const links = {
  /** Abre o aplicativo de mapas com a rota até a praça. */
  comoChegar: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
  mapaEmbed: `https://www.google.com/maps?q=${q}&z=16&output=embed`,
};

/* ───────────────── Textos (curtos, para entender sem precisar ler muito) ───────────────── */

export const textos = {
  /** Seção "Sobre o evento": texto enviado pela organização em 22/11/2026, encurtado. */
  sobre: {
    frase: "Sobre o evento",
    titulo: "O que é o Churrasco LAB?",
    chamada: "Muito mais que um evento de churrasco. Uma experiência que une sabor, conhecimento e oportunidades.",
    paragrafos: [
      "Um evento gratuito que reúne gastronomia, capacitação profissional e empreendedorismo para quem é apaixonado pelo universo do churrasco.",
      "Em dois dias, você aprende com chefs e pitmasters, acompanha aulas-show, descobre novas técnicas e conhece caminhos para transformar a paixão pelo churrasco em fonte de renda.",
      "O evento também valoriza o empreendedorismo, incentiva a qualificação profissional e fortalece a economia local.",
    ],
    fecho: "Aqui, o churrasco vai muito além da brasa: é aprendizado, conexão e transformação!",
    /** Números e atrações do flyer oficial da 2ª edição (Instagram @churrascolab). */
    atracoes: [
      { id: "aulas", n: "6", titulo: "Aulas-show", texto: "com pitmasters no palco" },
      { id: "paineis", n: "2", titulo: "Painéis", texto: "de conversa" },
      { id: "estandes", n: "30", titulo: "Estandes", texto: "15 do churrasco + 15 de economia solidária" },
      { id: "praca", n: "", titulo: "Praça de alimentação", texto: "churrasco assado na hora" },
      { id: "podcast", n: "", titulo: "Estúdio de podcast", texto: "" },
      { id: "shows", n: "", titulo: "Shows locais + DJ", texto: "" },
    ],
    /** Fotos da edição passada, publicadas no Instagram oficial. */
    fotos: [
      { src: "/sobre/foto-acougue.webp", alt: "Açougueiro apresenta um corte de carne durante aula na edição passada" },
      { src: "/sobre/foto-corte.webp", alt: "Profissional prepara cortes de carne na bancada" },
      { src: "/sobre/foto-aula.webp", alt: "Participante acompanha uma demonstração ao lado da grelha" },
      { src: "/sobre/foto-facas.webp", alt: "Facas artesanais expostas em um estande" },
      { src: "/sobre/foto-bebidas.webp", alt: "Garrafas expostas em um estande de produtores" },
    ],
    instagram: "https://www.instagram.com/churrascolab/",
  },
  /** Site imersivo: frase da abertura e os espaços do mapa (flyer oficial da 2ª edição). */
  imersivo: {
    manifesto: "Muito mais que um evento de churrasco. Uma experiência que une sabor, conhecimento e oportunidades.",
    mapaAviso: "Mapa ilustrativo. A posição de cada espaço na praça será divulgada pela organização.",
    espacos: [
      { id: "palco", titulo: "Palco das aulas-show", n: "6", texto: "Seis aulas-show com pitmasters no palco, nos dois dias de evento.", img: "/sobre/foto-acougue.webp", x: 50, y: 20, acao: "aulas" },
      { id: "paineis", titulo: "Painéis de conversa", n: "2", texto: "Dois painéis de conversa sobre o universo do churrasco e do empreendedorismo.", img: "/sobre/foto-aula.webp", x: 20, y: 36, acao: "" },
      { id: "podcast", titulo: "Estúdio de podcast", n: "", texto: "Um estúdio de podcast montado dentro do evento.", img: "/sobre/edicao-passada.webp", x: 80, y: 36, acao: "" },
      { id: "churrasco", titulo: "Estandes do churrasco", n: "15", texto: "Quinze estandes do universo do churrasco para conhecer de perto.", img: "/sobre/foto-facas.webp", x: 24, y: 64, acao: "" },
      { id: "solidaria", titulo: "Economia solidária", n: "15", texto: "Quinze estandes de economia solidária, com produtores e empreendedores locais.", img: "/sobre/foto-bebidas.webp", x: 76, y: 64, acao: "" },
      { id: "praca", titulo: "Praça de alimentação", n: "", texto: "Churrasco assado na hora.", img: "/sobre/foto-corte.webp", x: 50, y: 52, acao: "" },
      { id: "shows", titulo: "Shows locais + DJ", n: "", texto: "Música ao vivo com atrações locais e DJ.", img: "/fotos/grelha-carne-celular.webp", x: 50, y: 84, acao: "" },
    ],
  },
  privacidade: "Ao se inscrever, você autoriza a organização do evento a usar seus dados para registrar a inscrição e enviar avisos.",
  compartilhar: () =>
    `Churrasco LAB Brasília 2026 🔥\n27 e 28 de novembro, na Praça da Bíblia, em Ceilândia.\nEntrada gratuita, com aulas-show.\nInscreva-se: ${SITE_URL}`,
};
