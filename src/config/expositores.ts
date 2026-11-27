/**
 * CREDENCIAMENTO DE EXPOSITORES · textos e opções do formulário.
 *
 * As atividades admitidas e a lista de informações pedidas (itens "a" a "l") vêm das regras
 * enviadas pela organização em 27/11/2026. As OPÇÕES das listas (forma de organização, tempo de
 * atuação, meios de pagamento e necessidades) foram sugeridas por nós para facilitar o
 * preenchimento no celular: troque aqui se o regulamento definir outras.
 *
 * Os pedidos são gravados na tabela `churrascolab_expositores` (Supabase) e os arquivos vão para
 * o bucket privado `churrascolab-expositores`. Quem vê tudo isso é a área restrita (/admin).
 */
export const expositores = {
  tabela: "churrascolab_expositores",
  bucket: "churrascolab-expositores",
  funcaoArquivo: "churrascolab-arquivo",

  titulo: "Credenciamento de expositores",
  chamada: "Quer expor no Churrasco LAB Brasília? Preencha o formulário e a organização entra em contato.",
  /** Texto das regras, como enviado pela organização. */
  admitidas:
    "Serão admitidas atividades relacionadas à produção e comercialização de alimentos preparados, carnes, acompanhamentos, temperos, molhos, conservas, hortaliças, produtos agroalimentares, utensílios, acessórios e artesanato associado ao preparo, ao serviço ou à experiência gastronômica.",

  atividades: ["Alimentos preparados", "Carnes", "Acompanhamentos", "Temperos", "Molhos", "Conservas", "Hortaliças", "Produtos agroalimentares", "Utensílios", "Acessórios", "Artesanato ligado à gastronomia"],
  organizacoes: ["MEI (microempreendedor individual)", "Microempresa ou empresa", "Cooperativa", "Associação", "Grupo ou coletivo informal", "Produtor(a) individual ou autônomo(a)", "Outra"],
  tempos: ["Menos de 1 ano", "De 1 a 3 anos", "De 3 a 5 anos", "Mais de 5 anos"],
  pagamentos: ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito"],
  necessidades: ["Energia elétrica", "Ponto de água", "Refrigeração", "Armazenamento"],

  /** Arquivos: fotos, catálogo ou portfólio. Os mesmos limites valem no banco. */
  arquivos: { maximo: 5, tamanhoMb: 5, tipos: ["image/jpeg", "image/png", "image/webp", "application/pdf"], aceitar: "image/jpeg,image/png,image/webp,application/pdf" },

  declaracao: "Declaro que as informações são verdadeiras e que estou ciente das condições de participação do Churrasco LAB Brasília 2026.",
  privacidade: "Ao enviar, você autoriza a organização do evento a usar estes dados para analisar o credenciamento e entrar em contato.",
  sucesso: "Recebemos o seu pedido de credenciamento. A organização vai analisar e entrar em contato pelo WhatsApp informado.",
} as const;
