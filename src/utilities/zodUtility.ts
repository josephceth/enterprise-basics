import { z } from 'zod';

export function validateWithZod(schema: z.ZodSchema, data: any) {
  try {
    const parseData = schema.parse(data);
    return parseData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isError: true, error: error.flatten().fieldErrors as Record<string, string[]> };
    }
    return { isError: true, error: `An unknown error occurred ${error}` };
  }
}
