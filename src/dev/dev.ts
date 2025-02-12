//create excel file and save to drive
import { createDelimitedFileByteArray } from '../delimitedFiles/createDelimitedFileByteArray';
import { createExcelFileByteArray } from '../excel/createExcelFileByteArray';
import { saveFileBytesToPath } from '../fileSystem/saveFileBytesToPath';
import { getAzureConfigValue } from '../azure/appConfig/getAppConfigValue';
import { importDelimitedFile } from '../delimitedFiles/importDelimitedFile';
import { readExcelSheetData } from '../excel/readExcelSheetData';
import { readTextFile } from '../fileSystem/readTextFile';
import { graphUserSearchByEmail } from '../msGraph/graphUserSearchByEmail';
async function main() {
  console.log('Creating excel file...');
  const data = [
    { name: 'John', age: 30, joined: new Date() },
    { name: 'Jane', age: 25, joined: new Date() },
  ];

  console.log('data', data);
  const excelBytes = await createExcelFileByteArray(data);
  console.log('excelBytes', excelBytes);
  await saveFileBytesToPath(excelBytes, 'test.xlsx', 'c:/exports');
  console.log('File saved to c:/exports');

  const appConfigValue = await getAzureConfigValue('ADP-FSA:FilePath', 'dev');
  console.log('appConfigValue', appConfigValue);

  const delimitedBytes = await createDelimitedFileByteArray(data);
  console.log('delimitedBytes', delimitedBytes);
  await saveFileBytesToPath(delimitedBytes, 'test.csv', 'c:/exports');
  console.log('File saved to c:/exports');

  const delimitedFile = await importDelimitedFile('c:/exports/test.csv', ',');
  console.log('delimitedFile', delimitedFile);

  const excelData = await readExcelSheetData('c:/exports/test.xlsx', 'Sheet1');
  console.log('excelData', excelData);

  const textFile = await readTextFile('c:/exports/sql.sql');
  console.log('textFile', textFile);

  const [smtpHost, smtpPassword, smtpPort, smtpUsername, tenantId, clientId, clientSecret] = await Promise.all([
    getAzureConfigValue('SMTP:Host', 'prod'),
    getAzureConfigValue('SMTP:Password', 'prod'),
    getAzureConfigValue('SMTP:Port', 'prod'),
    getAzureConfigValue('SMTP:Username', 'prod'),
    getAzureConfigValue('GraphExplorer:TenantId', 'prod'),
    getAzureConfigValue('GraphExplorer:ClientId', 'prod'),
    getAzureConfigValue('GraphExplorer:ClientSecret', 'prod'),
  ]);

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Missing required environment variables');
  }

  const graphUser = await graphUserSearchByEmail('', tenantId, clientId, clientSecret);
  console.log('graphUser', graphUser);
}

main().catch(console.error);
