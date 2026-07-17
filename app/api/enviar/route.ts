import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { verificarToken, TokenInvalidoError } from "@/lib/token";
import { withTransaction } from "@/lib/db";
import { respostaSchema, paraRespostaPayload } from "@/lib/validacao";
import type { RespostaPayload } from "@/lib/perguntas";

export const dynamic = "force-dynamic";

class JaRespondidaError extends Error {}

function extrairToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

/**
 * Trava anti-duplicidade + gravação da resposta, em UMA transação:
 *   1. INSERT ... ON CONFLICT (cpf_hash) DO NOTHING em `respondentes`.
 *   2. Se rowCount == 0 -> CPF já respondeu -> aborta (JaRespondidaError).
 *   3. Se inseriu -> grava em `respostas` (sem cpf/hash/id de colaborador).
 *
 * NUNCA usar SELECT seguido de INSERT aqui — abre condição de corrida entre
 * duas submissões concorrentes com o mesmo CPF.
 */
async function gravarResposta(
  cpfHash: string,
  payload: RespostaPayload
): Promise<void> {
  await withTransaction(async (client) => {
    const travaResult = await client.query(
      "INSERT INTO pesquisa_ti.respondentes (cpf_hash) VALUES ($1) ON CONFLICT (cpf_hash) DO NOTHING",
      [cpfHash]
    );

    if (travaResult.rowCount === 0) {
      throw new JaRespondidaError();
    }

    await client.query(
      `INSERT INTO pesquisa_ti.respostas (
        unidade, equipamento_principal, avaliacao_equipamento,
        acessorios_notebook, usa_celular_corp, avaliacao_celular,
        avaliacao_atendimento, avaliacao_presenca, resolucao_tempo,
        itens_melhoria, item_melhoria_outro, equipamento_prejudica,
        nps, ti_faz_bem, principal_melhoria, sugestao
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        payload.unidade,
        payload.equipamento_principal,
        payload.avaliacao_equipamento,
        payload.acessorios_notebook,
        payload.usa_celular_corp,
        payload.avaliacao_celular,
        payload.avaliacao_atendimento,
        payload.avaliacao_presenca,
        payload.resolucao_tempo,
        payload.itens_melhoria,
        payload.item_melhoria_outro,
        payload.equipamento_prejudica,
        payload.nps,
        payload.ti_faz_bem,
        payload.principal_melhoria,
        payload.sugestao,
      ]
    );
  });
}

export async function POST(req: NextRequest) {
  const token = extrairToken(req);
  if (!token) {
    return NextResponse.json({ error: "token_invalido" }, { status: 401 });
  }

  let cpfHash: string;
  try {
    ({ cpfHash } = await verificarToken(token));
  } catch (err) {
    if (err instanceof TokenInvalidoError) {
      return NextResponse.json({ error: "token_invalido" }, { status: 401 });
    }
    throw err;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "validacao", campos: ["body"] },
      { status: 400 }
    );
  }

  const parsed = respostaSchema.safeParse(body);
  if (!parsed.success) {
    const campos = [
      ...new Set(
        (parsed.error as ZodError).issues.map((issue) =>
          issue.path.join(".")
        )
      ),
    ];
    return NextResponse.json({ error: "validacao", campos }, { status: 400 });
  }

  const payload = paraRespostaPayload(parsed.data);

  try {
    await gravarResposta(cpfHash, payload);
  } catch (err) {
    if (err instanceof JaRespondidaError) {
      return NextResponse.json({ error: "ja_respondida" }, { status: 409 });
    }
    console.error("erro ao gravar resposta", err);
    return NextResponse.json({ error: "erro_interno" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
