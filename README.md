# enterprise-basics

A utility library for enterprise applications. It streamlines common business tasks by providing functions to process delimited and Excel files, generate professional PDFs, and handle email communications with attachments.

## Excel Functions

### createExcelBytes

Creates an Excel file from an array of objects and returns it as a byte array.

```typescript
import { createExcelBytes } from 'enterprise-basics';
const data = [
  { name: 'John', age: 30, joined: new Date() },
  { name: 'Jane', age: 25, joined: new Date() },
];
const bytes = await createExcelBytes(data, {
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

Saves binary data (like Excel file bytes) to a specified path.

```typescript
import { saveFileBytesToPath } from 'enterprise-basics';
const path = await saveFileBytesToPath('path/to/save/file.xlsx', 'path/to/save/file.xlsx');
```
