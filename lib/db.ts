import { Pool } from "pg";

declare global {
  var _pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!globalThis._pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL não configurada");
    }
    globalThis._pgPool = new Pool({ connectionString });
  }
  return globalThis._pgPool;
}

// O Pool real só é criado no primeiro uso (query/connect), nunca na
// importação do módulo — o Next.js avalia route handlers durante o build
// (coleta de dados de página) mesmo sem haver uma requisição real, e isso
// não pode exigir DATABASE_URL configurada.
const pool = {
  query: (...args: Parameters<Pool["query"]>) => getPool().query(...args),
  connect: () => getPool().connect(),
} as Pool;

export default pool;

/**
 * Executa `fn` dentro de uma transação, fazendo commit ao final e rollback
 * em caso de erro. O client é sempre liberado de volta ao pool.
 */
export async function withTransaction<T>(
  fn: (client: import("pg").PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
