# enterprise-basics

A utility library for enterprise applications. It streamlines common business tasks by providing functions to process delimited and Excel files, generate professional PDFs, and handle email communications with attachments.

## Azure Functions

### getAzureConfigValue

Retrieves a configuration value from Azure App Configuration. Requires an environment variable or .env file to store the connection string, it cannot be passed in as a parameter. The connection string is stored in the environment variable AZURE_APP_CONFIG_CONNECTION_STRING or you can pass in a custom environment variable key as the 2nd parameter.

```typescript
import { getAzureConfigValue } from 'enterprise-basics';
const value = await getAzureConfigValue('my-key');
```

or

```typescript
const value = await getAzureConfigValue('my-key', 'Custom-Key');
```

## Delimted File Functions

### createDelimitedFileByteArray

Creates a delimited file (CSV) from an array of objects and returns it as a byte array. It can then be passed to other functions like saveFileBytesToPath or sendEmail as the fileBytes attachment parameter.

```typescript
import { createDelimitedFileByteArray } from 'enterprise-basics';
const data = [
  { name: 'John', age: 30, joined: new Date() },
  { name: 'Jane', age: 25, joined: new Date() },
];
const bytes = await createDelimitedFileByteArray(data);
```

### importDelimitedFile

Imports and parses a delimited file (CSV, TSV, etc.) into an array of objects.

```typescript
import { importDelimitedFile } from 'enterprise-basics';
const data = await importDelimitedFile('path/to/delimited/file.csv', ',');
```

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
const data = await readExcelSheetData('path/to/excel/file.xlsx', 'Sheet1', 1);
```

## File System Functions

### readTextFile

Reads a text file and returns it as a string, can be any text file type (txt, sql, csv, etc.).

```typescript
import { readTextFile } from 'enterprise-basics';
const data = await readTextFile('path/to/text/file.txt');
```

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

## MS Graph Functions

### graphUserSearchByEmail

Searches for a user in Microsoft Graph by email address. Requires a tenantId, clientId, and clientSecret, from an Azure App Registration that has been granted access to the Graph API users.read.all permission. Has a built in function to authenticate and get a token from Azure/Entra.

```typescript
import { graphUserSearchByEmail } from 'enterprise-basics';

const [tenantId, clientId, clientSecret] = await Promise.all([
  getAzureConfigValue('GraphExplorer:TenantId', 'prod'),
  getAzureConfigValue('GraphExplorer:ClientId', 'prod'),
  getAzureConfigValue('GraphExplorer:ClientSecret', 'prod'),
]);

if (!tenantId || !clientId || !clientSecret) {
  throw new Error('Missing required environment variables');
}

const graphUser = await graphUserSearchByEmail('my-email@gmail.com', tenantId, clientId, clientSecret);
console.log('graphUser', graphUser);
```
