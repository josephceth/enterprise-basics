//Azure App Configuration
export { AzureAppConfig } from './azure/appConfig/AzureAppConfig.js';

//Azure Storage
export { uploadBlob } from './azure/storage/uploadBlob.js';
export { deleteBlob } from './azure/storage/deleteBlob.js';
export { getBlob } from './azure/storage/getBlob.js';
export type { UploadParams } from './azure/storage/uploadBlob.js';

//Azure AI
export { generateCompletion } from './azure/ai/generateCompletion.js';
export { transcribeAudio } from './azure/ai/transcribeAudio.js';
export { createEmbeddings } from './azure/ai/createEmbeddings.js';

//Azure AI Search
export { ensureIndex } from './azure/aiSearch/ensureIndex.js';
export { queryHybridSemantic } from './azure/aiSearch/queryHybridSemantic.js';
export { upsertDocument } from './azure/aiSearch/upsertDocument.js';
export { getIndexConfiguration } from './azure/aiSearch/getIndexConfiguration.js';
export type { SearchResultItem, SearchParams } from './azure/aiSearch/queryHybridSemantic.js';
export type { EnsureIndexParams } from './azure/aiSearch/ensureIndex.js';
export type { UpsertDocumentParams } from './azure/aiSearch/upsertDocument.js';

//Database
export { executeSqlQuery } from './database/mssql/executeSQLQuery.js';
export type { MSSQLDBConfig } from './database/mssql/executeSQLQuery.js';

//Delimited Files
export { createDelimitedFileBytes } from './delimitedFiles/createDelimitedFileByteArray.js';
export { importDelimitedFile } from './delimitedFiles/importDelimitedFile.js';

//Email
export { EmailClient } from './email/EmailClient.js';
export type { EmailWithAttachment, SMTPConfig, Attachment } from './email/EmailClient.js';

//Excel
export { readExcelSheetData } from './excel/readExcelSheetData.js';
export { createExcelFileByteArray } from './excel/createExcelFileByteArray.js';
export type { ExcelRow, ExcelCellValue } from './excel/readExcelSheetData.js';

//File System
export { saveFileBytesToPath } from './fileSystem/saveFileBytesToPath.js';
export { readTextFileCleaned, readTextFileRaw } from './fileSystem/readTextFile.js';
export { getEnvValue } from './fileSystem/getEnvValue.js';

//MS Graph
export { graphUserSearchByEmail } from './msGraph/graphUserSearchByEmail.js';

//pdf
export { createPdfFromHtml } from './pdf/createPdfFromHtml.js';
export { parsePDF } from './pdf/parsePDF.js';

//Vercel AI
export { analyzeDocument } from './ai/vercel/analyzeDocument.js';
export { generateEmbedding } from './ai/vercel/generateEmbedding.js';
export { generateLLMTextResponse } from './ai/vercel/aiCompletions.js';
export { generateLLMStreamedTextResponse } from './ai/vercel/aiCompletions.js';
export { consolidateLLMConversation } from './ai/vercel/aiCompletions.js';
export { generateLLMStructuredOutput } from './ai/vercel/aiStructuredOutput.js';
export { createAzureLLMClient } from './ai/vercel/aiClient.js';
export { createOpenAILLMClient } from './ai/vercel/aiClient.js';
export type { AzureAIFoundryConfig } from './ai/vercel/aiClient.js';
export type { OpenAISchema } from './ai/vercel/aiClient.js';
export type { generationOptionsSchema } from './ai/vercel/aiStructuredOutput.js';
export type { LanguageModel } from 'ai';

//Twilio
export { sendSMS } from './twilio/sendSMS.js';
export type { TwilioConfig } from './twilio/sendSMS.js';
export type { SendSmsResult } from './twilio/sendSMS.js';
