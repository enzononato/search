import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sessaoAdminAtualValida } from "@/lib/adminSession";
import { UNIDADES } from "@/lib/perguntas";

export const dynamic = "force-dynamic";

const COLUNAS = [
  "id",
  "criado_em",
  "unidade",
  "equipamento_principal",
  "avaliacao_equipamento",
  "comentario_avaliacao_equipamento",
  "acessorios_notebook",
  "usa_celular_corp",
  "avaliacao_celular",
  "comentario_avaliacao_celular",
  "avaliacao_atendimento",
  "comentario_avaliacao_atendimento",
  "avaliacao_presenca",
  "comentario_avaliacao_presenca",
  "resolucao_tempo",
  "itens_melhoria",
  "item_melhoria_outro",
  "equipamento_prejudica",
  "nps",
  "ti_faz_bem",
  "principal_melhoria",
  "sugestao",
] as const;

function escapeCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const texto = Array.isArray(valor) ? valor.join(";") : String(valor);
  if (/[",\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
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

  const { rows } = await pool.query(
    `SELECT ${COLUNAS.join(", ")}
     FROM pesquisa_ti.respostas
     ${where}
     ORDER BY criado_em`,
    params
  );

  const linhas = [
    COLUNAS.join(","),
    ...rows.map((row) => COLUNAS.map((coluna) => escapeCsv(row[coluna])).join(",")),
  ];
  const csv = "﻿" + linhas.join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="respostas${unidade ? `-${unidade}` : ""}.csv"`,
    },
  });
}
