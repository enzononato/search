/**
 * Fonte única de verdade das 15 perguntas do questionário.
 *
 * Usado tanto pelo frontend (renderização do formulário) quanto pelo
 * backend (validação em /api/enviar). NÃO duplicar estas listas em
 * outro lugar — qualquer nova opção deve ser adicionada aqui.
 */

export const UNIDADES = [
  "Revalle Juazeiro",
  "Revalle Bonfim",
  "Revalle Pernambuco",
  "Revalle Ribeira do Pombal",
  "Revalle Paulo Afonso",
  "Revalle Alagoinhas",
  "Revalle Serrinha",
] as const;

export type Unidade = (typeof UNIDADES)[number];

export const EQUIPAMENTO_PRINCIPAL_OPTIONS = [
  { value: "notebook", label: "Notebook" },
  { value: "desktop", label: "Desktop" },
  { value: "celular", label: "Celular" },
  { value: "nenhum", label: "Nenhum" },
] as const;

export type EquipamentoPrincipal =
  (typeof EQUIPAMENTO_PRINCIPAL_OPTIONS)[number]["value"];

/**
 * Q2 é de múltipla escolha. "nenhum" é mutuamente exclusivo com as demais
 * opções (marcar "nenhum" desmarca o resto e vice-versa) — reforçado tanto
 * no cliente quanto na validação do servidor.
 */
export const EQUIPAMENTO_PRINCIPAL_NENHUM: EquipamentoPrincipal = "nenhum";

/** Presença deste valor em equipamento_principal habilita a pergunta 4 (acessórios do notebook). */
export const EQUIPAMENTOS_COM_NOTEBOOK: EquipamentoPrincipal[] = ["notebook"];

export const ACESSORIOS_NOTEBOOK_OPTIONS = [
  { value: "sim", label: "Sim" },
  { value: "parcialmente", label: "Parcialmente" },
  { value: "nao", label: "Não" },
  { value: "nao_utiliza", label: "Não utilizo notebook" },
] as const;

export type AcessoriosNotebook =
  (typeof ACESSORIOS_NOTEBOOK_OPTIONS)[number]["value"];

export const RESOLUCAO_TEMPO_OPTIONS = [
  { value: "sempre", label: "Sempre" },
  { value: "maioria", label: "Na maioria das vezes" },
  { value: "as_vezes", label: "Às vezes" },
  { value: "raramente", label: "Raramente" },
  { value: "nunca", label: "Nunca" },
] as const;

export type ResolucaoTempo = (typeof RESOLUCAO_TEMPO_OPTIONS)[number]["value"];

export const ITENS_MELHORIA_OPTIONS = [
  { value: "computadores_notebooks", label: "Computadores/Notebooks" },
  { value: "celulares_corporativos", label: "Celulares corporativos" },
  { value: "internet_wifi", label: "Internet/Wi-Fi" },
  { value: "impressoras", label: "Impressoras" },
  { value: "sistemas", label: "Sistemas" },
  { value: "atendimento_ti", label: "Atendimento da TI" },
  { value: "tempo_resposta", label: "Tempo de resposta" },
  { value: "comunicacao_ti", label: "Comunicação da TI" },
  { value: "outro", label: "Outro" },
] as const;

export type ItemMelhoria = (typeof ITENS_MELHORIA_OPTIONS)[number]["value"];

export const MAX_ITENS_MELHORIA = 3;

export const STARS_MIN = 1;
export const STARS_MAX = 5;

/** Nota (inclusive) a partir da qual o campo de comentário é oferecido nas perguntas de estrela. */
export const LIMITE_ESTRELA_COMENTARIO = 2;

export const NPS_MIN = 0;
export const NPS_MAX = 10;

/** Tamanho máximo aceito para campos de texto aberto (Q11, Q13, Q14, Q15, "Outro" da Q10). */
export const TEXTO_ABERTO_MAX_LEN = 2000;

export interface RespostaPayload {
  unidade: Unidade;
  equipamento_principal: EquipamentoPrincipal[];
  avaliacao_equipamento: number;
  comentario_avaliacao_equipamento: string | null;
  acessorios_notebook: AcessoriosNotebook;
  usa_celular_corp: boolean;
  avaliacao_celular: number | null;
  comentario_avaliacao_celular: string | null;
  avaliacao_atendimento: number;
  comentario_avaliacao_atendimento: string | null;
  avaliacao_presenca: number;
  comentario_avaliacao_presenca: string | null;
  resolucao_tempo: ResolucaoTempo;
  itens_melhoria: ItemMelhoria[];
  item_melhoria_outro: string | null;
  equipamento_prejudica: string | null;
  nps: number;
  ti_faz_bem: string | null;
  principal_melhoria: string | null;
  sugestao: string | null;
}
