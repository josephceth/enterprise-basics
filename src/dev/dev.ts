import { createDelimitedFileBytes } from '../delimitedFiles/createDelimitedFileByteArray';
import { createExcelFileByteArray } from '../excel/createExcelFileByteArray';
import { saveFileBytesToPath } from '../fileSystem/saveFileBytesToPath';
import { getAzureConfigValue } from '../azure/appConfig/getAppConfigValue';
import { importDelimitedFile } from '../delimitedFiles/importDelimitedFile';
import { readExcelSheetData } from '../excel/readExcelSheetData';
import { readTextFile } from '../fileSystem/readTextFile';
import { graphUserSearchByEmail } from '../msGraph/graphUserSearchByEmail';
import { generateCompletion } from '../azure/ai/generateCompletion';
import { sendEmail, SMTPConfig, EmailWithAttachment } from '../email/sendEmail';
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

  const [smtpHost, smtpPassword, smtpPort, smtpUsername, tenantId, clientId, clientSecret] = await Promise.all([
    getAzureConfigValue('SMTP:Host', 'prod'),
    getAzureConfigValue('SMTP:Password', 'prod'),
    getAzureConfigValue('SMTP:Port', 'prod'),
    getAzureConfigValue('SMTP:Username', 'prod'),
    getAzureConfigValue('GraphExplorer:TenantId', 'prod'),
    getAzureConfigValue('GraphExplorer:ClientId', 'prod'),
    getAzureConfigValue('GraphExplorer:ClientSecret', 'prod'),
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
    from: 'No Reply <no-reply@brownandroot.com>',
    to: ['joseph.chustz@brownandroot.com'],
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

  console.log('openaiEndpoint', openaiEndpoint);
  console.log('openaiApiKey', openaiApiKey);
  if (!openaiEndpoint || !openaiApiKey) {
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
}

main().catch(console.error);
