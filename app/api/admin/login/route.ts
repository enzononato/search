import { NextRequest, NextResponse } from "next/server";
import { criarSessaoAdmin, senhaAdminCorreta } from "@/lib/adminSession";
import { checarRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

function ipDoRequest(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "desconhecido";
}

export async function POST(req: NextRequest) {
  const ip = ipDoRequest(req);
  const rateLimit = checarRateLimit(`admin-login:${ip}`);
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
    return NextResponse.json({ error: "senha_invalida" }, { status: 400 });
  }

  const senha =
    typeof body === "object" && body !== null && "senha" in body
      ? (body as Record<string, unknown>).senha
      : undefined;

  if (typeof senha !== "string") {
    return NextResponse.json({ error: "senha_invalida" }, { status: 400 });
  }

  if (!senhaAdminCorreta(senha)) {
    return NextResponse.json({ error: "senha_invalida" }, { status: 401 });
  }

  await criarSessaoAdmin();
  return NextResponse.json({ ok: true }, { status: 200 });
}
