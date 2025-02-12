import * as ExcelJS from 'exceljs';
import { z } from 'zod';
import { validateWithZod } from '../utilities/zodUtility';

// More specific validation schema
const validationSchema = z.object({
  data: z.array(z.record(z.union([z.string(), z.number(), z.date(), z.boolean()]))).default([]),
});

/**
 * Configuration options for Excel file creation
 * @interface ExcelOptions
 * @property {string} [sheetName] - Name of the worksheet (default: 'Sheet1')
 * @property {string} [dateFormat] - Format for date values (default: 'mm/dd/yyyy')
 * @property {Partial<ExcelJS.Style>} [headerStyle] - Style configuration for header row
 */
export interface ExcelOptions {
  sheetName?: string;
  dateFormat?: string;
  headerStyle?: Partial<ExcelJS.Style>;
}

/**
 * Creates an Excel file from provided data and returns it as a byte array
 * @param {Record<string, unknown>[]} data - Array of objects to be converted to Excel rows
 * @param {ExcelOptions} [options] - Configuration options for the Excel file
 * @returns {Promise<Uint8Array | string>} - Returns byte array of Excel file or message if data is empty
 * @throws {Error} If validation fails or Excel creation encounters an error
 *
 * @example
 * const data = [
 *   { name: "John", age: 30, joined: new Date() },
 *   { name: "Jane", age: 25, joined: new Date() }
 * ];
 *
 * const bytes = await createExcelBytes(data, {
 *   sheetName: 'Employees',
 *   dateFormat: 'yyyy-mm-dd'
 * });
 */
export async function createExcelFileByteArray(
  data: Record<string, unknown>[],
  options: ExcelOptions = {},
): Promise<Uint8Array | string> {
  const {
    sheetName = 'Sheet1',
    dateFormat = 'mm/dd/yyyy',
    headerStyle = {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      },
      font: { bold: true, size: 12 },
    },
  } = options;

  const validationResult = validateWithZod(validationSchema, { data });
  if (validationResult.isError) {
    throw new Error(`Excel creation failed: ${JSON.stringify(validationResult.error)}`);
  }

  if (data.length === 0) {
    return 'The function ran successfully, but the data array was empty';
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Configure columns based on data headers
    const headers = Object.keys(data[0]);
    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: 15,
    }));

    // Add and format data rows
    data.forEach((row) => {
      const formattedRow = Object.entries(row).reduce((acc, [key, value]) => {
        if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
          const cell = worksheet.lastRow?.getCell(key);
          if (cell) cell.numFmt = dateFormat;
          return { ...acc, [key]: new Date(value) };
        }
        return { ...acc, [key]: value };
      }, {});
      worksheet.addRow(formattedRow);
    });

    // Apply header styling and autofilter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };
    worksheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Auto-fit columns based on content
    worksheet.columns?.forEach((column) => {
      if (!column.eachCell) return;
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        let columnLength = 10;
        if (cell.value instanceof Date) {
          // Format the date according to the specified format
          cell.numFmt = dateFormat;
          // Use the actual formatted length
          columnLength = dateFormat.length + 2;
        } else if (cell.value) {
          columnLength = cell.value.toString().length;
        }
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    return new Uint8Array(await workbook.xlsx.writeBuffer());
  } catch (error) {
    throw new Error(`Excel creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
