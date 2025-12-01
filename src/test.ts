import { scanFolderStructure } from './fileSystem/scanFolderStructure.js';

const sourcePath = 'C:\\temp\\safety';
const folderStructure = await scanFolderStructure(sourcePath);
console.log(folderStructure);
