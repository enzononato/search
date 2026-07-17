import pool from "./db";

/**
 * Consulta a tabela de colaboradores para verificar se um CPF existe.
 *
 * Nome da tabela/coluna não são hardcoded — são lidos de variáveis de
 * ambiente (ex.: `colaboradores-revalle`, que contém hífen) e usados com
 * quoting de identificador adequado, nunca interpolados como SQL livre.
 * O valor do CPF em si sempre vai como parâmetro ($1), nunca concatenado
 * na query.
 *
 * Não sabemos se a coluna de CPF na tabela está armazenada com ou sem
 * máscara, então normalizamos os dois lados da comparação para 11 dígitos
 * com `regexp_replace(coluna, '\D', '', 'g')`.
 */

// Permite hífen (nomes reais como "colaboradores-revalle" usam), mas ainda
// bloqueia aspas duplas e qualquer caractere que permitiria escapar do
// identifier quoting.
const IDENT_VALIDO = /^[A-Za-z_][A-Za-z0-9_-]*$/;

function quoteIdent(nome: string): string {
  if (!IDENT_VALIDO.test(nome)) {
    throw new Error(
      `Identificador inválido em configuração de colaboradores: "${nome}"`
    );
  }
  return `"${nome}"`;
}

/** Suporta identificador simples ("tabela") ou qualificado por schema ("schema.tabela"). */
function quoteIdentQualificado(nome: string): string {
  return nome
    .split(".")
    .map((parte) => quoteIdent(parte))
    .join(".");
}

function getConfig(): { tabela: string; coluna: string } {
  const tabela = process.env.COLABORADORES_TABLE;
  const coluna = process.env.COLABORADORES_CPF_COLUMN;
  if (!tabela || !coluna) {
    throw new Error(
      "COLABORADORES_TABLE e COLABORADORES_CPF_COLUMN precisam estar configurados no ambiente"
    );
  }
  return { tabela, coluna };
}

/**
 * `cpfNormalizado` deve ter exatamente 11 dígitos (ver lib/cpf.ts).
 * Nunca logar o CPF — em caso de erro, logar apenas que a consulta falhou.
 */
export async function existeColaborador(
  cpfNormalizado: string
): Promise<boolean> {
  const { tabela, coluna } = getConfig();
  const tabelaSql = quoteIdentQualificado(tabela);
  const colunaSql = quoteIdent(coluna);

  const sql = `
    SELECT EXISTS (
      SELECT 1 FROM ${tabelaSql}
      WHERE regexp_replace(${colunaSql}::text, '\\D', '', 'g') = $1
    ) AS existe
  `;

  const { rows } = await pool.query<{ existe: boolean }>(sql, [
    cpfNormalizado,
  ]);
  return rows[0]?.existe ?? false;
}
