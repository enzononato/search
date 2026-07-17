import { z } from "zod";
import {
  UNIDADES,
  EQUIPAMENTO_PRINCIPAL_OPTIONS,
  EQUIPAMENTOS_COM_NOTEBOOK,
  ACESSORIOS_NOTEBOOK_OPTIONS,
  RESOLUCAO_TEMPO_OPTIONS,
  ITENS_MELHORIA_OPTIONS,
  MAX_ITENS_MELHORIA,
  STARS_MIN,
  STARS_MAX,
  NPS_MIN,
  NPS_MAX,
  TEXTO_ABERTO_MAX_LEN,
  type EquipamentoPrincipal,
  type AcessoriosNotebook,
  type ResolucaoTempo,
  type ItemMelhoria,
  type RespostaPayload,
} from "./perguntas";

/**
 * Validação do payload de /api/enviar. Reusa as listas/opções de
 * lib/perguntas.ts (fonte única de verdade) — não duplicar valores aqui.
 * Toda regra de validação do cliente precisa existir aqui também, já que
 * o cliente não é confiável.
 */

const unidadeSchema = z.enum(UNIDADES);

const equipamentoPrincipalValues = EQUIPAMENTO_PRINCIPAL_OPTIONS.map(
  (o) => o.value
) as [EquipamentoPrincipal, ...EquipamentoPrincipal[]];
const equipamentoPrincipalSchema = z.enum(equipamentoPrincipalValues);

const acessoriosNotebookValues = ACESSORIOS_NOTEBOOK_OPTIONS.map(
  (o) => o.value
) as [AcessoriosNotebook, ...AcessoriosNotebook[]];
const acessoriosNotebookSchema = z.enum(acessoriosNotebookValues);

const resolucaoTempoValues = RESOLUCAO_TEMPO_OPTIONS.map(
  (o) => o.value
) as [ResolucaoTempo, ...ResolucaoTempo[]];
const resolucaoTempoSchema = z.enum(resolucaoTempoValues);

const itemMelhoriaValues = ITENS_MELHORIA_OPTIONS.map(
  (o) => o.value
) as [ItemMelhoria, ...ItemMelhoria[]];
const itemMelhoriaSchema = z.enum(itemMelhoriaValues);

const estrelasSchema = z.number().int().min(STARS_MIN).max(STARS_MAX);

const textoAbertoOpcionalSchema = z
  .string()
  .trim()
  .max(TEXTO_ABERTO_MAX_LEN)
  .nullable()
  .optional()
  .transform((v) => (v ? v : null));

const respostaSchemaBase = z.object({
  unidade: unidadeSchema,
  equipamento_principal: equipamentoPrincipalSchema,
  avaliacao_equipamento: estrelasSchema,
  acessorios_notebook: acessoriosNotebookSchema,
  usa_celular_corp: z.boolean(),
  avaliacao_celular: estrelasSchema.nullable(),
  avaliacao_atendimento: estrelasSchema,
  avaliacao_presenca: estrelasSchema,
  resolucao_tempo: resolucaoTempoSchema,
  itens_melhoria: z
    .array(itemMelhoriaSchema)
    .min(1, "selecione ao menos 1 item")
    .max(MAX_ITENS_MELHORIA, `selecione no máximo ${MAX_ITENS_MELHORIA} itens`)
    .refine(
      (itens) => new Set(itens).size === itens.length,
      "itens_melhoria não pode conter duplicados"
    ),
  item_melhoria_outro: textoAbertoOpcionalSchema,
  equipamento_prejudica: textoAbertoOpcionalSchema,
  nps: z.number().int().min(NPS_MIN).max(NPS_MAX),
  ti_faz_bem: textoAbertoOpcionalSchema,
  principal_melhoria: textoAbertoOpcionalSchema,
  sugestao: textoAbertoOpcionalSchema,
});

export const respostaSchema = respostaSchemaBase.superRefine((data, ctx) => {
  const podeTerNotebook = (
    EQUIPAMENTOS_COM_NOTEBOOK as string[]
  ).includes(data.equipamento_principal);

  if (!podeTerNotebook && data.acessorios_notebook !== "nao_utiliza") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["acessorios_notebook"],
      message:
        "acessorios_notebook deve ser 'nao_utiliza' quando não há notebook (Q2)",
    });
  }

  if (!data.usa_celular_corp && data.avaliacao_celular !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["avaliacao_celular"],
      message: "avaliacao_celular deve ser nulo quando usa_celular_corp = false",
    });
  }

  if (
    data.itens_melhoria.includes("outro") &&
    !data.item_melhoria_outro
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["item_melhoria_outro"],
      message: "item_melhoria_outro é obrigatório quando 'outro' está em itens_melhoria",
    });
  }

  if (
    !data.itens_melhoria.includes("outro") &&
    data.item_melhoria_outro
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["item_melhoria_outro"],
      message: "item_melhoria_outro só é permitido quando 'outro' está em itens_melhoria",
    });
  }
});

export type RespostaValidada = z.infer<typeof respostaSchemaBase>;

/** Converte o resultado já validado no shape gravado em `respostas`. */
export function paraRespostaPayload(data: RespostaValidada): RespostaPayload {
  return {
    unidade: data.unidade,
    equipamento_principal: data.equipamento_principal,
    avaliacao_equipamento: data.avaliacao_equipamento,
    acessorios_notebook: data.acessorios_notebook,
    usa_celular_corp: data.usa_celular_corp,
    avaliacao_celular: data.avaliacao_celular,
    avaliacao_atendimento: data.avaliacao_atendimento,
    avaliacao_presenca: data.avaliacao_presenca,
    resolucao_tempo: data.resolucao_tempo,
    itens_melhoria: data.itens_melhoria,
    item_melhoria_outro: data.item_melhoria_outro,
    equipamento_prejudica: data.equipamento_prejudica,
    nps: data.nps,
    ti_faz_bem: data.ti_faz_bem,
    principal_melhoria: data.principal_melhoria,
    sugestao: data.sugestao,
  };
}
