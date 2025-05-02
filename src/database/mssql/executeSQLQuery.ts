import * as sql from 'mssql';
import { validateWithZod } from '../../utilities/zodUtility.js';
import { z } from 'zod';

export type MSSQLDBConfig = {
  user: string;
  password: string;
  server: string;
  database: string;
};

const validationSchema = z.object({
  query: z.string().min(10, 'Query length is not long enough'),
});

export async function executeSqlQuery(dbConfig: MSSQLDBConfig, query: string) {
  const validationResult = validateWithZod(validationSchema, { query });

  if (validationResult.isError) {
    throw new Error(`Execute Sql Query validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  const configWithCertOptions = {
    ...dbConfig,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  };

  await sql.connect(configWithCertOptions);
  const sqlResponse = await sql.query(query);
  return sqlResponse.recordset;
}
