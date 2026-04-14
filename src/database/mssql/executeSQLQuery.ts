import * as sql from 'mssql';
import { validateWithZod } from '../../utilities/zodUtility.js';
import { z } from 'zod/v3';

export type MSSQLDBConfig = {
  user: string;
  password: string;
  server: string;
  database: string;
};

const validationSchema = z.object({
  query: z.string().min(10, 'Query length is not long enough'),
});

const poolCache = new Map<string, Promise<sql.ConnectionPool>>();

function getPoolKey(config: MSSQLDBConfig, options: sql.IOptions): string {
  return `${config.server}|${config.database}|${config.user}|${JSON.stringify(options)}`;
}

function getPool(config: sql.config): Promise<sql.ConnectionPool> {
  const key = getPoolKey(config as MSSQLDBConfig, config.options!);

  const existing = poolCache.get(key);
  if (existing) return existing;

  const connectPromise = new sql.ConnectionPool(config).connect().then((pool) => {
    pool.on('error', () => {
      poolCache.delete(key);
    });
    return pool;
  });

  poolCache.set(key, connectPromise);

  connectPromise.catch(() => {
    poolCache.delete(key);
  });

  return connectPromise;
}

export async function executeSqlQuery(dbConfig: MSSQLDBConfig, query: string, options: sql.IOptions | null = null) {
  const validationResult = validateWithZod(validationSchema, { query });

  if (validationResult.isError) {
    throw new Error(`Execute Sql Query validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  const config: sql.config = {
    ...dbConfig,
    options: options ?? {
      encrypt: true,
      trustServerCertificate: true,
    },
  };

  const pool = await getPool(config);
  const sqlResponse = await pool.request().query(query);
  return sqlResponse.recordset;
}

export async function closeAllPools(): Promise<void> {
  const pools = await Promise.allSettled([...poolCache.values()]);
  poolCache.clear();
  await Promise.allSettled(
    pools
      .filter((r): r is PromiseFulfilledResult<sql.ConnectionPool> => r.status === 'fulfilled')
      .map((r) => r.value.close()),
  );
}
