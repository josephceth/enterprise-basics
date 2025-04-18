# Enterprise Basics

A collection of utility functions for common enterprise operations in Azure and other services.

## Installation

```bash
npm install enterprise-basics
```

## Features

### Azure App Configuration

- `AzureAppConfig`: Class for interacting with Azure App Configuration. Provides methods to retrieve configuration values from Azure App Configuration. Supports environment-specific configuration through labels.

### Azure Storage

- `uploadBlob`: Uploads a file to Azure Blob Storage with metadata support
- `deleteBlob`: Deletes a blob from Azure Blob Storage
- `getBlob`: Downloads a blob from Azure Blob Storage as a Buffer

### Azure AI

- `generateCompletion`: Generates a single-turn completion using Azure-hosted OpenAI models.
  Designed for one-off completions and should not be used for maintaining chat history or conversational interactions.
- `transcribeAudio`: Transcribes audio using Azure OpenAI's Whisper model. The endpoint can be obtained from `getAppConfig('OPENAI_WHISPER_ENDPOINT', 'prod')`. Supports various audio formats including flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, and webm.

### Database

- `executeSqlQuery`: Executes SQL queries against Microsoft SQL Server databases

### Delimited Files

- `createDelimitedFileBytes`: Creates a byte array from data in a delimited format
- `importDelimitedFile`: Imports data from a delimited file

### Excel

- `readExcelSheetData`: Reads data from Excel sheets
- `createExcelFileByteArray`: Creates an Excel file as a byte array
- Types:
  - `ExcelRow`: Type definition for Excel row data
  - `ExcelCellValue`: Type definition for Excel cell values

### File System

- `saveFileBytesToPath`: Saves byte array data to a file path
- `readTextFile`: Reads text content from a file
- `getEnvValue`: Retrieves environment variable values with validation

### MS Graph

- `graphUserSearchByEmail`: Searches for users in Microsoft Graph by email address

### Email

- `EmailClient`: Class for sending emails using SMTP. Provides methods to send emails with optional attachments. SMTP configuration is set during instantiation.

```typescript
// Create an instance with SMTP configuration
const emailClient = new EmailClient({
  host: 'smtp.example.com',
  port: 587,
  auth: { user: 'user', pass: 'pass' },
});

// Send an email
await emailClient.sendEmail({
  from: 'sender@example.com',
  to: ['recipient@example.com'],
  subject: 'Test Email',
  body: 'This is a test email with attachment',
  attachments: [
    {
      filename: 'test.pdf',
      fileBytes: new Uint8Array([255, 255]),
      contentType: 'application/pdf',
    },
  ],
});
```

### PDF

- `createPdfFromHtml`: Converts HTML content to a PDF file and returns it as a byte array. Supports custom page formats, orientation, and margins.
- `htmlToPdfBuffer`: Converts HTML content to a PDF buffer using puppeteer. Returns the PDF content as a `Uint8Array`.

## Usage Examples

### Azure Storage

```typescript
import { uploadBlob, deleteBlob, getBlob } from 'enterprise-basics';

// Upload a file
await uploadBlob(connectionString, 'my-container', 'path/to/file.txt', fileObject);

// Delete a blob
await deleteBlob(connectionString, 'my-container', 'path/to/file.txt');

// Download a blob
const buffer = await getBlob(connectionString, 'my-container', 'path/to/file.txt');
```

### Azure App Configuration

```typescript
import { getAzureConfigValue } from 'enterprise-basics';

const configValue = await getAzureConfigValue('myApp.setting', 'dev');
```

### Azure AI (Single-turn Completion)

```typescript
import { generateCompletion, transcribeAudio } from 'enterprise-basics';

// Note: This is for single-turn completions only, not for chat/conversations
const completion = await generateCompletion(
  'https://your-resource.openai.azure.com',
  'your-api-key',
  'your-deployment-name',
  [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' },
  ],
  { temperature: 0.7 },
);

// Transcribe audio
const transcription = await transcribeAudio(
  'https://your-resource.openai.azure.com',
  'your-api-key',
  'your-whisper-deployment',
  audioFile,
  { language: 'en' },
);
```

### Excel Operations

```typescript
import { readExcelSheetData, createExcelFileByteArray } from 'enterprise-basics';

// Read Excel data
const data = await readExcelSheetData(filePath, sheetName);

// Create Excel file
const excelBytes = await createExcelFileByteArray(data);
```

### File System

```typescript
import { saveFileBytesToPath, readTextFile, getEnvValue } from 'enterprise-basics';

// Save file
await saveFileBytesToPath(filePath, fileBytes);

// Read text file
const content = await readTextFile(filePath);

// Get environment variable
const apiKey = await getEnvValue('API_KEY');
```

### MS Graph

```typescript
import { graphUserSearchByEmail } from 'enterprise-basics';

const user = await graphUserSearchByEmail('user@example.com');
```

### Email

```typescript
import { sendEmail } from 'enterprise-basics';

await sendEmail(
  {
    from: 'sender@example.com',
    to: ['recipient@example.com'],
    subject: 'Test Email',
    body: 'This is a test email with attachment',
    attachments: [
      {
        filename: 'test.pdf',
        fileBytes: new Uint8Array([255, 255]),
        contentType: 'application/pdf',
      },
    ],
  },
  {
    host: 'smtp.example.com',
    port: 587,
    auth: { user: 'user', pass: 'pass' },
  },
);
```

### PDF Generation

```typescript
import { htmlToPdfBuffer } from 'enterprise-basics';

const htmlContent = '<h1>Hello, PDF!</h1>';
try {
  const pdfBytes = await htmlToPdfBuffer(htmlContent);
  // Save or use the pdfBytes
  console.log('PDF generated successfully');
} catch (error) {
  console.error('Failed to generate PDF:', error);
}
```

## Error Handling

All functions include proper error handling and will throw descriptive errors when:

- Input validation fails
- Required parameters are missing
- Service operations fail
- Files are not found
- Network requests fail

## TypeScript Support

This package is written in TypeScript and includes type definitions for all functions and their parameters.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
