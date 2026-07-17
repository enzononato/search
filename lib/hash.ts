import { createHash } from "crypto";

/**
 * Gera o hash usado como trava anti-duplicidade (`respondentes.cpf_hash`).
 * SHA-256 do CPF normalizado (11 dígitos) concatenado com um pepper secreto
 * mantido fora do banco (variável de ambiente). O pepper impede que alguém
 * com acesso só ao dump do banco recupere CPFs por força bruta/rainbow table.
 *
 * `cpf` deve já estar normalizado (ver lib/cpf.ts). Nunca logar o CPF nem o hash junto do CPF em claro.
 */
export function hashCpf(cpfNormalizado: string): string {
  const pepper = process.env.CPF_PEPPER;
  if (!pepper) {
    throw new Error("CPF_PEPPER não configurado");
  }
  return createHash("sha256").update(cpfNormalizado + pepper).digest("hex");
}
