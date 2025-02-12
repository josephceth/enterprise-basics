import { importExcelFile } from './excel/readExcelSheetData';

async function main() {
  const data = await importExcelFile('c:/temp/test.xlsx', 'Sheet1');
  console.log(data);
}

main().catch(console.error);
