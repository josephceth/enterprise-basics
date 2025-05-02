import * as ExcelJS from 'exceljs';
import { z } from 'zod';
import { validateWithZod } from '../utilities/zodUtility.js';

const validationSchema = z.object({
  data: z.array(z.record(z.any())).default([]),
});

/**
 * Creates a delimited file (CSV) from an array of data objects.
 *
 * @param {any[]} data - Array of objects to be converted to CSV format
 * @param {',' | ';' | '|'} [delimiter=','] - Character to use as delimiter between fields
 * @param {string} [dateFormat='mm/dd/yyyy'] - Format to use for date fields
 * @param {Object} [columnFormats] - Optional column format specifications
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
export async function createDelimitedFileBytes(
  data: any[],
  delimiter: ',' | ';' | '|' = ',',
  dateFormat: string = 'mm/dd/yyyy',
  columnFormats?: { [key: string]: { type: 'text' | 'date' | 'number' } },
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

    // Helper function to detect if a value should be a date
    const isValidDate = (value: any): boolean => {
      if (value instanceof Date) return true;
      if (typeof value !== 'string') return false;
      const date = new Date(value);
      return date instanceof Date && !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(value); // Only match explicit date formats
    };

    // Set up columns with smart type detection
    worksheet.columns = headers.map((header) => {
      const columnFormat = columnFormats?.[header];
      const sampleValues = data.map((row) => row[header]).filter((v) => v != null);

      let style = {};

      // Use explicit format if provided
      if (columnFormat) {
        style = {
          numFmt: columnFormat.type === 'text' ? '@' : columnFormat.type === 'date' ? dateFormat : 'General',
        };
      } else {
        // Auto-detect format based on first non-null value
        const firstValue = sampleValues[0];
        if (typeof firstValue === 'string' && (firstValue.includes('-') || firstValue.includes('/'))) {
          style = { numFmt: '@' }; // Force text for strings with dashes or slashes
        }
      }

      return {
        header,
        key: header,
        width: 15,
        style,
      };
    });

    // Add all data rows
    data.forEach((row) => {
      const formattedRow = { ...row };
      Object.entries(row).forEach(([key, value]) => {
        if (!value) {
          formattedRow[key] = '';
          return;
        }

        const columnFormat = columnFormats?.[key];

        if (columnFormat?.type === 'text' || typeof value === 'string') {
          formattedRow[key] = value.toString();
        } else if (columnFormat?.type === 'date' || isValidDate(value)) {
          if (value instanceof Date || typeof value === 'string' || typeof value === 'number') {
            formattedRow[key] = new Date(value);
            const cell = worksheet.lastRow?.getCell(key);
            if (cell) {
              cell.numFmt = dateFormat;
            }
          }
        } else {
          formattedRow[key] = value;
        }
      });
      worksheet.addRow(formattedRow);
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
