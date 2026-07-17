/**
 * Rate limit simples em memória, por IP, para /api/validar-cpf.
 *
 * A tela de CPF revela se um CPF existe na base de colaboradores (403 vs.
 * outros códigos), então sem rate limit um atacante poderia enumerar CPFs
 * válidos por força bruta. MVP: janela fixa em memória do processo — é
 * suficiente para uma única instância Node (PM2 em modo fork, sem cluster).
 * Se o app rodar em cluster/múltiplas instâncias no futuro, trocar por um
 * store compartilhado (ex.: Redis).
 */

const JANELA_MS = 15 * 60 * 1000;
const MAX_TENTATIVAS = 5;

interface Registro {
  contagem: number;
  resetaEm: number;
}

const registros = new Map<string, Registro>();

export interface RateLimitResultado {
  permitido: boolean;
  retryAfterSegundos?: number;
}

export function checarRateLimit(chave: string): RateLimitResultado {
  const agora = Date.now();
  const registro = registros.get(chave);

  if (!registro || registro.resetaEm <= agora) {
    registros.set(chave, { contagem: 1, resetaEm: agora + JANELA_MS });
    return { permitido: true };
  }

  if (registro.contagem >= MAX_TENTATIVAS) {
    return {
      permitido: false,
      retryAfterSegundos: Math.ceil((registro.resetaEm - agora) / 1000),
    };
  }

  registro.contagem += 1;
  return { permitido: true };
}

// Evita crescimento ilimitado do Map ao longo do tempo.
setInterval(() => {
  const agora = Date.now();
  for (const [chave, registro] of registros) {
    if (registro.resetaEm <= agora) registros.delete(chave);
  }
}, JANELA_MS).unref();
