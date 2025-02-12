//create excel file and save to drive
import { createDelimitedFileByteArray } from '../delimitedFiles/createDelimitedFileByteArray';
import { createExcelFileByteArray } from '../excel/createExcelFileByteArray';
import { saveFileBytesToPath } from '../fileSystem/saveFileBytesToPath';
import { getAzureConfigValue } from '../azure/appConfig/getAppConfigValue';

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
}

main().catch(console.error);
