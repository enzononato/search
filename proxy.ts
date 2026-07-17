import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, tokenAdminValido } from "@/lib/adminSession";

/**
 * Checagem otimista (só olha o cookie, sem tocar o banco) para redirecionar
 * quem tenta acessar /admin sem sessão. A checagem de verdade acontece em
 * cada Route Handler de /api/admin/* (ver lib/adminSession.ts) — Proxy sozinho
 * não é suficiente como camada de segurança para as rotas de API.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const valido = await tokenAdminValido(token);
    if (!valido) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
