import { timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_session";
const EXPIRACAO = "12h";
const EXPIRACAO_SEGUNDOS = 60 * 60 * 12;

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado");
  }
  return new TextEncoder().encode(secret);
}

/** Assina um token de sessão de admin (~12h). Reusa o mesmo JWT_SECRET do fluxo da pesquisa. */
export async function assinarSessaoAdmin(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRACAO)
    .sign(getSecret());
}

/** Checagem "pura" (sem depender de next/headers) — usada pelo proxy.ts e pelas rotas. */
export async function tokenAdminValido(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.admin === true;
  } catch {
    return false;
  }
}

export async function criarSessaoAdmin(): Promise<void> {
  const token = await assinarSessaoAdmin();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EXPIRACAO_SEGUNDOS,
  });
}

export async function apagarSessaoAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

/** Usada dentro de Route Handlers (app/api/admin/*) — checagem de verdade, não apenas otimista. */
export async function sessaoAdminAtualValida(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return tokenAdminValido(token);
}

/** Comparação em tempo constante — evita vazar por timing quantos caracteres acertaram. */
export function senhaAdminCorreta(informada: string): boolean {
  const esperada = process.env.ADMIN_PASSWORD;
  if (!esperada) {
    throw new Error("ADMIN_PASSWORD não configurado");
  }
  const a = Buffer.from(informada);
  const b = Buffer.from(esperada);
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}
