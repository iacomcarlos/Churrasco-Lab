/**
 * INSCRIÇÕES · configuração central.
 *
 * As inscrições são gravadas num banco Supabase. A chave abaixo é a chave PÚBLICA
 * ("publishable"), feita para ficar no navegador: ela só permite INSERIR uma inscrição
 * nova. Ninguém consegue ler a lista de inscritos por ela (regra de segurança no banco).
 *
 * Para ver os inscritos: painel do Supabase, projeto "COGNUS FINANCE", Table Editor:
 *   churrascolab_inscritos          → lista sem repetição (última inscrição de cada WhatsApp)
 *   churrascolab_resumo_por_aula    → quantos inscritos por aula
 *   churrascolab_inscricoes         → tudo o que chegou, em ordem
 *
 * Se `url` e `chave` ficarem vazios, o formulário não aparece no site público
 * e os botões de inscrição levam para a programação (nenhum link falso é criado).
 */
export const inscricao = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://khpcfovwxvrodibcuvbp.supabase.co",
  chave: process.env.NEXT_PUBLIC_SUPABASE_KEY || "sb_publishable__Qal06UIWT5SfRXeKduJKw_bi-QccGQ",
  tabela: "churrascolab_inscricoes",
  /** E-mail obrigatório? (WhatsApp e nome são sempre obrigatórios.) */
  emailObrigatorio: false,
} as const;

export const inscricaoAtiva = Boolean(inscricao.url && inscricao.chave);

/** Regiões administrativas do DF (Ceilândia primeiro, por ser a casa do evento). */
export const regioes = [
  "Ceilândia",
  "Sol Nascente / Pôr do Sol",
  "Taguatinga",
  "Samambaia",
  "Águas Claras",
  "Arniqueira",
  "Vicente Pires",
  "Brazlândia",
  "Recanto das Emas",
  "Riacho Fundo",
  "Riacho Fundo II",
  "Gama",
  "Santa Maria",
  "Guará",
  "Núcleo Bandeirante",
  "Candangolândia",
  "Park Way",
  "Plano Piloto",
  "Sudoeste / Octogonal",
  "Cruzeiro",
  "Lago Sul",
  "Lago Norte",
  "Jardim Botânico",
  "São Sebastião",
  "Paranoá",
  "Itapoã",
  "Varjão",
  "Sobradinho",
  "Sobradinho II",
  "Fercal",
  "Planaltina",
  "Arapoanga",
  "SCIA / Estrutural",
  "SIA",
  "Água Quente",
  "Entorno do DF",
  "Outra cidade",
] as const;
