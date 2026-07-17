import { NextRequest, NextResponse } from "next/server";
import { normalizeCpf, isValidCpf } from "@/lib/cpf";
import { hashCpf } from "@/lib/hash";
import { existeColaborador } from "@/lib/colaboradores";
import { assinarToken } from "@/lib/token";
import { checarRateLimit } from "@/lib/ratelimit";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

function ipDoRequest(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "desconhecido";
}

export async function POST(req: NextRequest) {
  const ip = ipDoRequest(req);
  const rateLimit = checarRateLimit(ip);
  if (!rateLimit.permitido) {
    return NextResponse.json(
      { error: "muitas_tentativas" },
      {
        status: 429,
        headers: rateLimit.retryAfterSegundos
          ? { "Retry-After": String(rateLimit.retryAfterSegundos) }
          : undefined,
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "cpf_invalido" }, { status: 400 });
  }

  const cpfBruto =
    typeof body === "object" && body !== null && "cpf" in body
      ? (body as Record<string, unknown>).cpf
      : undefined;

  if (typeof cpfBruto !== "string") {
    return NextResponse.json({ error: "cpf_invalido" }, { status: 400 });
  }

  const cpf = normalizeCpf(cpfBruto);
  if (!isValidCpf(cpf)) {
    return NextResponse.json({ error: "cpf_invalido" }, { status: 400 });
  }

  const cpfHash = hashCpf(cpf);

  let existe: boolean;
  try {
    existe = await existeColaborador(cpf);
  } catch (err) {
    console.error("erro ao consultar tabela de colaboradores", err);
    return NextResponse.json({ error: "erro_interno" }, { status: 500 });
  }

  if (!existe) {
    // mensagem genérica proposital — não revelar detalhes que ajudem enumeração
    return NextResponse.json({ error: "nao_encontrado" }, { status: 403 });
  }

  const { rows } = await pool.query(
    "SELECT 1 FROM pesquisa_ti.respondentes WHERE cpf_hash = $1",
    [cpfHash]
  );
  if (rows.length > 0) {
    return NextResponse.json({ error: "ja_respondida" }, { status: 409 });
  }

  const token = await assinarToken({ cpfHash });
  return NextResponse.json({ token }, { status: 200 });
}
