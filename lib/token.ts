import { SignJWT, jwtVerify, errors as joseErrors } from "jose";

const EXPIRACAO = "30m";

export interface TokenPayload {
  cpfHash: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Emite um token efêmero (~30min) carregando o `cpf_hash` já validado.
 * Isso evita reenviar o CPF no submit — o hash usado na trava anti-duplicidade
 * em /api/enviar é sempre o mesmo que passou por /api/validar-cpf.
 * O token nunca é persistido junto da resposta.
 */
export async function assinarToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRACAO)
    .sign(getSecret());
}

export class TokenInvalidoError extends Error {}

/** Verifica e decodifica o token. Lança TokenInvalidoError se inválido/expirado. */
export async function verificarToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.cpfHash !== "string") {
      throw new TokenInvalidoError("token sem cpfHash");
    }
    return { cpfHash: payload.cpfHash };
  } catch (err) {
    if (err instanceof joseErrors.JOSEError) {
      throw new TokenInvalidoError(err.message);
    }
    throw err;
  }
}
