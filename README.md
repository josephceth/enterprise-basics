# enterprise-basics

A utility library for enterprise applications. It streamlines common business tasks by providing functions to process delimited and Excel files, generate professional PDFs, and handle email communications with attachments.

## Excel Functions

### createExcelFileByteArray

Creates an Excel file from an array of objects and returns it as a byte array.

```typescript
import { createExcelFileByteArray } from 'enterprise-basics';
const data = [
  { name: 'John', age: 30, joined: new Date() },
  { name: 'Jane', age: 25, joined: new Date() },
];
const bytes = await createExcelFileByteArray(data, {
  sheetName: 'Employees',
  dateFormat: 'mm/dd/yyyy',
  headerStyle: {
    font: { bold: true, size: 12 },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    },
  },
});
```

### readExcelSheetData

Reads data from an Excel file and returns it as an array of objects.

```typescript
import { readExcelSheetData } from 'enterprise-basics';
const data = await readExcelSheetData('path/to/excel/file.xlsx', 'Sheet1');
```

## File System Functions

### saveFileBytesToPath

Saves binary data (like Excel file bytes) to a specified path, with optional sheet name, date format, and header style.

```typescript
import { saveFileBytesToPath } from 'enterprise-basics';
import { createExcelFileByteArray } from 'enterprise-basics';

const data = [
  { name: 'John', age: 30, joined: new Date() },
  { name: 'Jane', age: 25, joined: new Date() },
];

const excelBytes = await createExcelFileByteArray(data, {
  sheetName: 'Employees',
  dateFormat: 'mm/dd/yyyy',
  headerStyle: {
    font: { bold: true, size: 12 },
  },
});
const path = await saveFileBytesToPath(excelBytes, 'test.xlsx', 'c:/exports');
```
