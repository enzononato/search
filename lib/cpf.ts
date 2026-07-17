/**
 * Normalização e validação de CPF (formato + dígitos verificadores).
 * Mesma lógica é usada no cliente (feedback imediato) e no servidor
 * (fonte de verdade — nunca confiar só na validação do cliente).
 */

/** Remove tudo que não for dígito. Não garante que o resultado tenha 11 dígitos. */
export function normalizeCpf(input: string): string {
  return input.replace(/\D/g, "");
}

function calcularDigitoVerificador(digitos: string, pesoInicial: number): number {
  let soma = 0;
  for (let i = 0; i < digitos.length; i++) {
    soma += parseInt(digitos[i], 10) * (pesoInicial - i);
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * Valida um CPF já normalizado (11 dígitos). Rejeita sequências com todos
 * os dígitos iguais (ex.: "00000000000"), que passariam matematicamente
 * no cálculo do dígito verificador mas não são CPFs válidos.
 */
export function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const primeiroDigito = calcularDigitoVerificador(cpf.slice(0, 9), 10);
  if (primeiroDigito !== parseInt(cpf[9], 10)) return false;

  const segundoDigito = calcularDigitoVerificador(cpf.slice(0, 10), 11);
  if (segundoDigito !== parseInt(cpf[10], 10)) return false;

  return true;
}
