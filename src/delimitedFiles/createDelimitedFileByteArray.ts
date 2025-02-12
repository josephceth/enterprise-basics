import * as ExcelJS from 'exceljs';
import { z } from 'zod';
import { validateWithZod } from '../utilities/zodUtility';

const validationSchema = z.object({
  data: z.array(z.record(z.any())).default([]),
});

/**
 * Creates a delimited file (CSV) from an array of data objects.
 *
 * @param {any[]} data - Array of objects to be converted to CSV format
 * @param {',' | ';' | '|'} [delimiter=','] - Character to use as delimiter between fields
 * @param {string} [dateFormat='mm/dd/yyyy'] - Format to use for date fields
 *
 * @returns {Promise<Uint8Array | string>} Returns either:
 *   - Uint8Array containing the CSV file bytes
 *   - Error message string if data array is empty
 *
 * @throws {Error} If data validation fails or CSV creation encounters an error
 *
 * @example
 * const data = [
 *   { name: 'John', date: new Date() },
 *   { name: 'Jane', date: '2024-01-01' }
 * ];
 * const csvBytes = await createDelimitedFileBytes(data, ',', 'mm/dd/yyyy');
 */
export async function createDelimitedFileByteArray(
  data: any[],
  delimiter: ',' | ';' | '|' = ',',
  dateFormat: string = 'mm/dd/yyyy',
): Promise<Uint8Array | string> {
  const validationResult = validateWithZod(validationSchema, { data });

  if (validationResult.isError) {
    throw new Error(`Create CSV validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  if (data.length === 0) {
    return 'CSV file creation attempted, but data array was empty';
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  try {
    // Get headers from first data object
    const headers = Object.keys(data[0]);

    // Set up columns
    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: 15,
    }));

    // Format dates before adding rows
    const formattedData = data.map((row) => {
      const formattedRow = { ...row };
      Object.entries(row).forEach(([key, value]) => {
        if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
          const date = new Date(value);
          // Format the date according to the specified format
          formattedRow[key] = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
        }
      });
      return formattedRow;
    });

    // Add formatted rows
    formattedData.forEach((row) => {
      worksheet.addRow(row);
    });

    const buffer = await workbook.csv.writeBuffer({
      formatterOptions: {
        delimiter: delimiter,
      },
    });
    return new Uint8Array(buffer);
  } catch (error) {
    throw new Error(`Validation checks passed, but CSV creation failed: ${error}`);
  }
}
