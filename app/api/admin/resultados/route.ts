import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sessaoAdminAtualValida } from "@/lib/adminSession";
import { UNIDADES, RESOLUCAO_TEMPO_OPTIONS, ITENS_MELHORIA_OPTIONS } from "@/lib/perguntas";

export const dynamic = "force-dynamic";

interface TextoAberto {
  unidade: string;
  texto: string;
  criado_em: string;
}

export async function GET(req: NextRequest) {
  if (!(await sessaoAdminAtualValida())) {
    return NextResponse.json({ error: "nao_autenticado" }, { status: 401 });
  }

  const unidade = req.nextUrl.searchParams.get("unidade");
  if (unidade && !(UNIDADES as readonly string[]).includes(unidade)) {
    return NextResponse.json({ error: "unidade_invalida" }, { status: 400 });
  }

  const where = unidade ? "WHERE unidade = $1" : "";
  const params = unidade ? [unidade] : [];

  const [porUnidade, npsRaw, medias, resolucaoRaw, itensRaw, textosRaw] = await Promise.all([
    pool.query<{ unidade: string; total: number }>(
      `SELECT unidade, count(*)::int AS total
       FROM pesquisa_ti.respostas
       ${where}
       GROUP BY unidade
       ORDER BY unidade`,
      params
    ),
    pool.query<{ total: number; promotores: number; neutros: number; detratores: number }>(
      `SELECT
         count(*)::int AS total,
         count(*) FILTER (WHERE nps >= 9)::int AS promotores,
         count(*) FILTER (WHERE nps BETWEEN 7 AND 8)::int AS neutros,
         count(*) FILTER (WHERE nps <= 6)::int AS detratores
       FROM pesquisa_ti.respostas
       ${where}`,
      params
    ),
    pool.query<{
      avaliacao_equipamento: number | null;
      avaliacao_celular: number | null;
      avaliacao_atendimento: number | null;
      avaliacao_presenca: number | null;
    }>(
      `SELECT
         avg(avaliacao_equipamento)::float8 AS avaliacao_equipamento,
         avg(avaliacao_celular)::float8 AS avaliacao_celular,
         avg(avaliacao_atendimento)::float8 AS avaliacao_atendimento,
         avg(avaliacao_presenca)::float8 AS avaliacao_presenca
       FROM pesquisa_ti.respostas
       ${where}`,
      params
    ),
    pool.query<{ resolucao_tempo: string; total: number }>(
      `SELECT resolucao_tempo, count(*)::int AS total
       FROM pesquisa_ti.respostas
       ${where}
       GROUP BY resolucao_tempo`,
      params
    ),
    pool.query<{ item: string; total: number }>(
      `SELECT item, count(*)::int AS total
       FROM pesquisa_ti.respostas, unnest(itens_melhoria) AS item
       ${where}
       GROUP BY item
       ORDER BY count(*) DESC`,
      params
    ),
    pool.query<{
      unidade: string;
      equipamento_prejudica: string | null;
      ti_faz_bem: string | null;
      principal_melhoria: string | null;
      sugestao: string | null;
      criado_em: string;
    }>(
      `SELECT unidade, equipamento_prejudica, ti_faz_bem, principal_melhoria, sugestao, criado_em
       FROM pesquisa_ti.respostas
       ${where}
       ORDER BY criado_em DESC`,
      params
    ),
  ]);

  const npsRow = npsRaw.rows[0] ?? { total: 0, promotores: 0, neutros: 0, detratores: 0 };
  const percentual =
    npsRow.total > 0
      ? Math.round(((npsRow.promotores - npsRow.detratores) / npsRow.total) * 100)
      : null;

  const totalPorResolucao = new Map(resolucaoRaw.rows.map((r) => [r.resolucao_tempo, r.total]));
  const distribuicaoResolucaoTempo = RESOLUCAO_TEMPO_OPTIONS.map((opcao) => ({
    valor: opcao.value,
    label: opcao.label,
    total: totalPorResolucao.get(opcao.value) ?? 0,
  }));

  const labelItem = new Map<string, string>(
    ITENS_MELHORIA_OPTIONS.map((o) => [o.value, o.label])
  );
  const topItensMelhoria = itensRaw.rows.map((row) => ({
    valor: row.item,
    label: labelItem.get(row.item) ?? row.item,
    total: row.total,
  }));

  const textosAbertos: {
    equipamento_prejudica: TextoAberto[];
    ti_faz_bem: TextoAberto[];
    principal_melhoria: TextoAberto[];
    sugestao: TextoAberto[];
  } = {
    equipamento_prejudica: [],
    ti_faz_bem: [],
    principal_melhoria: [],
    sugestao: [],
  };

  for (const row of textosRaw.rows) {
    if (row.equipamento_prejudica) {
      textosAbertos.equipamento_prejudica.push({
        unidade: row.unidade,
        texto: row.equipamento_prejudica,
        criado_em: row.criado_em,
      });
    }
    if (row.ti_faz_bem) {
      textosAbertos.ti_faz_bem.push({
        unidade: row.unidade,
        texto: row.ti_faz_bem,
        criado_em: row.criado_em,
      });
    }
    if (row.principal_melhoria) {
      textosAbertos.principal_melhoria.push({
        unidade: row.unidade,
        texto: row.principal_melhoria,
        criado_em: row.criado_em,
      });
    }
    if (row.sugestao) {
      textosAbertos.sugestao.push({
        unidade: row.unidade,
        texto: row.sugestao,
        criado_em: row.criado_em,
      });
    }
  }

  return NextResponse.json({
    unidadeFiltro: unidade,
    totalRespostas: npsRow.total,
    porUnidade: porUnidade.rows,
    nps: { ...npsRow, percentual },
    medias: medias.rows[0] ?? {
      avaliacao_equipamento: null,
      avaliacao_celular: null,
      avaliacao_atendimento: null,
      avaliacao_presenca: null,
    },
    distribuicaoResolucaoTempo,
    topItensMelhoria,
    textosAbertos,
  });
}
