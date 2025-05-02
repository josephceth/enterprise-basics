import { createDelimitedFileBytes } from '../delimitedFiles/createDelimitedFileByteArray.js';
import { createExcelFileByteArray } from '../excel/createExcelFileByteArray.js';
import { saveFileBytesToPath } from '../fileSystem/saveFileBytesToPath.js';
import { AzureAppConfig } from '../azure/appConfig/AzureAppConfig.js';
import { importDelimitedFile } from '../delimitedFiles/importDelimitedFile.js';
import { readExcelSheetData } from '../excel/readExcelSheetData.js';
import { readTextFile } from '../fileSystem/readTextFile.js';
import { graphUserSearchByEmail } from '../msGraph/graphUserSearchByEmail.js';
import { generateCompletion } from '../azure/ai/generateCompletion.js';
import { transcribeAudio } from '../azure/ai/transcribeAudio.js';
import { EmailClient, SMTPConfig, EmailWithAttachment } from '../email/EmailClient.js';
import { createEmbeddings } from '../azure/ai/createEmbeddings.js';
import { parsePDF } from '../pdf/parsePDF.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  // console.log('Creating excel file...');
  // const data = [
  //   { name: 'John', age: 30, joined: new Date() },
  //   { name: 'Jane', age: 25, joined: new Date() },
  // ];

  // console.log('data', data);
  // const excelBytes = await createExcelFileByteArray(data);
  // console.log('excelBytes', excelBytes);
  // await saveFileBytesToPath(excelBytes, 'test.xlsx', 'c:/exports');
  // console.log('File saved to c:/exports');

  // const appConfigValue = await getAzureConfigValue('ADP-FSA:FilePath', 'dev');
  // console.log('appConfigValue', appConfigValue);

  // const delimitedBytes = await createDelimitedFileBytes(data);
  // console.log('delimitedBytes', delimitedBytes);
  // await saveFileBytesToPath(delimitedBytes, 'test.csv', 'c:/exports');
  // console.log('File saved to c:/exports');

  // const delimitedFile = await importDelimitedFile('c:/exports/test.csv', ',');
  // console.log('delimitedFile', delimitedFile);

  // const excelData = await readExcelSheetData('c:/exports/test.xlsx', 'Sheet1');
  // console.log('excelData', excelData);

  // const textFile = await readTextFile('c:/exports/sql.sql');
  // console.log('textFile', textFile);

  const azureAppConfigEndpoint = process.env.AZURE_APP_CONFIG_CONNECTION_STRING;
  console.log('azureAppConfigEndpoint', azureAppConfigEndpoint);
  if (!azureAppConfigEndpoint) {
    throw new Error('Missing required environment variables');
  }

  const appConfig = new AzureAppConfig(azureAppConfigEndpoint, 'prod');

  const [
    smtpHost,
    smtpPassword,
    smtpPort,
    smtpUsername,
    tenantId,
    clientId,
    clientSecret,
    embeddingEndpoint,
    embeddingApiKey,
    embeddingInstanceName,
    embeddingDeploymentName,
    embeddingApiVersion,
  ] = await Promise.all([
    appConfig.getAzureConfigValue('SMTP:Host'),
    appConfig.getAzureConfigValue('SMTP:Password'),
    appConfig.getAzureConfigValue('SMTP:Port'),
    appConfig.getAzureConfigValue('SMTP:Username'),
    appConfig.getAzureConfigValue('GraphExplorer:TenantId'),
    appConfig.getAzureConfigValue('GraphExplorer:ClientId'),
    appConfig.getAzureConfigValue('GraphExplorer:ClientSecret'),
    appConfig.getAzureConfigValue('AI:EmbeddingsURL'),
    appConfig.getAzureConfigValue('AI:EmbeddingsKey'),
    appConfig.getAzureConfigValue('AI:EmbeddingsInstanceName'),
    appConfig.getAzureConfigValue('AI:EmbeddingsDeploymentName'),
    appConfig.getAzureConfigValue('AI:EmbeddingsApiVersion'),
  ]);

  console.log('smtpHost', smtpHost);
  console.log('smtpPassword', smtpPassword);
  console.log('smtpPort', smtpPort);
  console.log('smtpUsername', smtpUsername);
  console.log('tenantId', tenantId);
  console.log('clientId', clientId);
  console.log('clientSecret', clientSecret);
  console.log('embeddingEndpoint', embeddingEndpoint);
  console.log('embeddingApiKey', embeddingApiKey);
  console.log('embeddingInstanceName', embeddingInstanceName);
  console.log('embeddingDeploymentName', embeddingDeploymentName);
  console.log('embeddingApiVersion', embeddingApiVersion);

  if (!smtpHost || !smtpPassword || !smtpPort || !smtpUsername || !tenantId || !clientId || !clientSecret) {
    throw new Error('Missing required environment variables');
  }

  const smtpconfig: SMTPConfig = {
    host: smtpHost,
    port: Number(smtpPort),
    auth: { user: smtpUsername, pass: smtpPassword },
  };

  const emailClient = new EmailClient(smtpconfig);

  const email: EmailWithAttachment = {
    from: 'noreply@brownandroot.com',
    to: ['joseph.chustz@brownandroot.com'],
    subject: 'Test Email',
    body: 'This is a test email',
  };

  await emailClient.sendEmail(email);
  // if (!tenantId || !clientId || !clientSecret) {
  //   throw new Error('Missing required environment variables');
  // }

  // const graphUser = await graphUserSearchByEmail('', tenantId, clientId, clientSecret);
  // console.log('graphUser', graphUser);

  const openaiEndpoint = process.env.OPENAI_ENDPOINT;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const whisperEndPoint = process.env.OPENAI_WHISPER_ENDPOINT;

  // console.log('openaiEndpoint', openaiEndpoint);
  // console.log('openaiApiKey', openaiApiKey);
  // console.log('whisperEndPoint', whisperEndPoint);
  if (!openaiEndpoint || !openaiApiKey) {
    throw new Error('Missing required environment variables');
  }

  if (!whisperEndPoint || !openaiApiKey) {
    throw new Error('Missing required environment variables');
  }

  const completion = await generateCompletion(openaiEndpoint, openaiApiKey, 'gpt-4o', [
    {
      role: 'user',
      content:
        'give me a list of 5 ice cream flavors and their prices. return your response in JSON format with the root object named response',
    },
  ]);
  console.log('completion', completion);

  //file at c:/temp/voiceRec.webm
  const audioFilePath = 'C:\\temp\\voiceRec.webm';
  console.log('Reading audio file from:', audioFilePath);
  const fileBuffer = await fs.promises.readFile(audioFilePath);
  console.log('File buffer size:', fileBuffer.length);
  const audioFile = new File([fileBuffer], path.basename(audioFilePath), { type: 'audio/webm' });
  console.log('Created audio file object:', {
    name: audioFile.name,
    size: audioFile.size,
    type: audioFile.type,
  });

  // console.log('Starting transcription...');
  // try {
  //   const transcription = await transcribeAudio(whisperEndPoint, openaiApiKey, 'whisper', audioFile);
  //   const completion = await generateCompletion(openaiEndpoint, openaiApiKey, 'gpt-4o', [
  //     {
  //       role: 'user',
  //       content: `Please summarize the following transcription: ${transcription}`,
  //     },
  //   ]);
  //   console.log('Transcription completed successfully:', transcription);
  //   console.log('Summary:', completion);
  // } catch (error) {
  //   console.error('Transcription failed:', error);
  //   throw error;
  // }

  const pdfFilePath = 'C:\\temp\\benefits.pdf';
  const pdfPages = await parsePDF(pdfFilePath);
  console.log('pdfPages', pdfPages.length);

  //for the first 2 pages, run them through gpt-4o to get a summary of the page
  // const page1Summary = await generateCompletion(openaiEndpoint, openaiApiKey, 'gpt-4o', [
  //   {
  //     role: 'user',
  //     content: `Please analyze the following document and break it down into distinct sections based on its content and context. Provide a brief title or heading for each section you identify, even if the original document doesn't explicitly label them. Aim to create coherent and meaningful sections that are easy to understand and reflect the structure of the content.  this will be used as the basis for an llm chat bot for our employees to its imperative that the data remains unchanged as it is reformatted": ${pdfPages[7].pageContent}`,
  //   },
  // ]);

  // console.log('page1Summary', page1Summary);

  const page2Summary = await generateCompletion(openaiEndpoint, openaiApiKey, 'gpt-4o', [
    {
      role: 'user',
      content: `Please analyze the following document and break it down into distinct sections based on its content and context. Provide a brief title or heading for each section you identify, even if the original document doesn't explicitly label them. Aim to create coherent and meaningful sections that are easy to understand and reflect the structure of the content.  this will be used as the basis for an llm chat bot for our employees to its imperative that the data remains unchanged as it is reformatted additionally, create a list of questions this information could answer": ${pdfPages[8].pageContent}`,
    },
  ]);

  console.log('page2Summary', page2Summary);
  // const pdfSummary = await generateCompletion(openaiEndpoint, openaiApiKey, 'gpt-4o', [
  //   {
  //     role: 'user',
  //     content: ` "Please analyze the following document and break it down into distinct sections based on its content and context. Provide a brief title or heading for each section you identify, even if the original document doesn't explicitly label them. Aim to create coherent and meaningful sections that are easy to understand and reflect the structure of the content.  this will be used as the basis for an llm chat bot for our employees to its imperative that the data remains unchanged as it is reformatted": ${pdfText}`,
  //   },
  // ]);
  // console.log('pdfSummary', pdfSummary);

  const embeddings = await createEmbeddings(
    [page2Summary],
    embeddingApiKey,
    embeddingInstanceName,
    embeddingDeploymentName,
    embeddingApiVersion,
  );
  console.log('embeddings', embeddings);
}

main().catch(console.error);
