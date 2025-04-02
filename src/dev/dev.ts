import { createDelimitedFileBytes } from '../delimitedFiles/createDelimitedFileByteArray';
import { createExcelFileByteArray } from '../excel/createExcelFileByteArray';
import { saveFileBytesToPath } from '../fileSystem/saveFileBytesToPath';
import { getAzureConfigValue } from '../azure/appConfig/getAppConfigValue';
import { importDelimitedFile } from '../delimitedFiles/importDelimitedFile';
import { readExcelSheetData } from '../excel/readExcelSheetData';
import { readTextFile } from '../fileSystem/readTextFile';
import { graphUserSearchByEmail } from '../msGraph/graphUserSearchByEmail';
import { generateCompletion } from '../azure/ai/generateCompletion';
import { transcribeAudio } from '../azure/ai/transcribeAudio';
import { sendEmail, SMTPConfig, EmailWithAttachment } from '../email/sendEmail';
import fs from 'fs';
import path from 'path';

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
  if (!azureAppConfigEndpoint) {
    throw new Error('Missing required environment variables');
  }

  const [smtpHost, smtpPassword, smtpPort, smtpUsername, tenantId, clientId, clientSecret] = await Promise.all([
    getAzureConfigValue('SMTP:Host', 'prod', azureAppConfigEndpoint),
    getAzureConfigValue('SMTP:Password', 'prod', azureAppConfigEndpoint),
    getAzureConfigValue('SMTP:Port', 'prod', azureAppConfigEndpoint),
    getAzureConfigValue('SMTP:Username', 'prod', azureAppConfigEndpoint),
    getAzureConfigValue('GraphExplorer:TenantId', 'prod', azureAppConfigEndpoint),
    getAzureConfigValue('GraphExplorer:ClientId', 'prod', azureAppConfigEndpoint),
    getAzureConfigValue('GraphExplorer:ClientSecret', 'prod', azureAppConfigEndpoint),
  ]);

  if (!smtpHost || !smtpPassword || !smtpPort || !smtpUsername || !tenantId || !clientId || !clientSecret) {
    throw new Error('Missing required environment variables');
  }

  const smtpconfig: SMTPConfig = {
    host: smtpHost,
    port: Number(smtpPort),
    auth: { user: smtpUsername, pass: smtpPassword },
  };

  const email: EmailWithAttachment = {
    from: '',
    to: [''],
    subject: 'Test Email',
    body: 'This is a test email',
  };

  await sendEmail(email, smtpconfig);
  // if (!tenantId || !clientId || !clientSecret) {
  //   throw new Error('Missing required environment variables');
  // }

  // const graphUser = await graphUserSearchByEmail('', tenantId, clientId, clientSecret);
  // console.log('graphUser', graphUser);

  const openaiEndpoint = process.env.OPENAI_ENDPOINT;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const whisperEndPoint = process.env.OPENAI_WHISPER_ENDPOINT;

  console.log('openaiEndpoint', openaiEndpoint);
  console.log('openaiApiKey', openaiApiKey);
  console.log('whisperEndPoint', whisperEndPoint);
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

  console.log('Starting transcription...');
  try {
    const transcription = await transcribeAudio(whisperEndPoint, openaiApiKey, 'whisper', audioFile);
    console.log('Transcription completed successfully:', transcription);
  } catch (error) {
    console.error('Transcription failed:', error);
    throw error;
  }
}

main().catch(console.error);
