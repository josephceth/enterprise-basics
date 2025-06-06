import * as ExcelJS from 'exceljs';
import { z } from 'zod';
import { validateWithZod } from '../utilities/zodUtility.js';
import { existsSync } from 'fs';

/**
 * Represents possible values that can be stored in an Excel cell
 */
export type ExcelCellValue =
  | string
  | number
  | boolean
  | Date
  | null
  | ExcelJS.CellErrorValue
  | ExcelJS.CellRichTextValue
  | ExcelJS.CellHyperlinkValue
  | ExcelJS.CellFormulaValue
  | ExcelJS.CellSharedFormulaValue;

/**
 * Represents a row of data from an Excel sheet where each key is the column header
 */
export type ExcelRow = Record<string, ExcelCellValue>;

/**
 * Validation schema for input parameters
 */
const validationSchema = z.object({
  filepath: z.string().min(10, 'filepath too short').nonempty('filepath cannot be empty'),
  sheetname: z.string().min(1, 'sheetname is too short').nonempty('sheetname cannot be empty'),
  headerRow: z.number().min(1, 'headerRow must be at least 1').max(100, 'headerRow must be less than 100'),
});

/**
 * Imports data from an Excel file (.xlsx)
 * @param filePath - Path to the Excel file
 * @param sheetName - Name of the worksheet to read
 * @param headerRow - Row number of the header row (1-based index) (default is 1)
 * @returns Array of objects where each object represents a row with column headers as keys
 * @throws {Error} If file doesn't exist, sheet not found, or validation fails
 */
export async function readExcelSheetData(
  filePath: string,
  sheetName: string,
  headerRow: number = 1,
): Promise<ExcelRow[]> {
  const validationResult = validateWithZod(validationSchema, { filepath: filePath, sheetname: sheetName, headerRow });

  if (validationResult.isError) {
    throw new Error(`Import delimited file validation failed: ${JSON.stringify(validationResult.error)}`);
  }

  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet(sheetName);
  if (!worksheet) {
    throw new Error(`Sheet '${sheetName}' not found in the workbook`);
  }

  const headers = worksheet.getRow(headerRow).values as string[];
  if (!headers?.length) {
    throw new Error('No headers found in the first row');
  }

  // Remove the first null element that Excel.js adds
  headers.shift();

  return (
    worksheet.getRows(headerRow + 1, worksheet.rowCount)?.map((row) => {
      const rowObject: ExcelRow = {};
      headers.forEach((header, index) => {
        const cell = row.getCell(index + 1);
        const value = cell.result ?? cell.value;
        const processedValue = value && typeof value === 'object' && 'result' in value ? value.result : value;
        rowObject[header] = (processedValue ?? null) as ExcelCellValue;
      });
      return rowObject;
    }) ?? []
  );
}
