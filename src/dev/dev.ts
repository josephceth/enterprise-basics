//create excel file and save to drive
import { createExcelFileByteArray } from '../excel/createExcelFileByteArray';
import { saveFileBytesToPath } from '../fileSystem/saveFileBytesToPath';

async function main() {
  console.log('Creating excel file...');
  const data = [
    { name: 'John', age: 30, joined: new Date() },
    { name: 'Jane', age: 25, joined: new Date() },
  ];

  console.log('data', data);
  const excelFile = await createExcelFileByteArray(data);
  console.log('excelFile', excelFile);
  await saveFileBytesToPath({ name: 'test.xlsx', data: excelFile }, 'c:/exports');
  console.log('File saved to c:/exports');
}

main().catch(console.error);
