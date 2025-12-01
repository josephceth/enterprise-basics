import { readdir, stat, writeFile, readFile, access } from 'fs/promises';
import { join, relative, dirname } from 'path';

export interface FileItem {
  name: string;
  fullPath: string;
  relativePath: string;
  isDirectory: boolean;
  depth: number;
}

export interface FolderStructure {
  files: FileItem[];
  folders: FileItem[];
  folderPaths: string[];
}

async function scanRecursive(startPath: string, allItems: FileItem[], depth: number = 0): Promise<void> {
  const indent = '    '.repeat(depth); // visual indentation for nested folders
  // console.log(`${indent}scanning: ${currentPath}`);

  let currentPath = startPath;
  try {
    // get all items in current directory
    const items = await readdir(currentPath);
    // console.log(`${indent}found ${items.length} items`);

    for (const item of items) {
      if (!item) {
        continue; // skip any undefined entries
      }

      const fullPath = join(currentPath, item);
      const relativePath = relative(currentPath, fullPath);

      try {
        // get file/folder statistics and metadata
        const stats = await stat(fullPath);
        const isDirectory = stats.isDirectory();

        const fileItem: FileItem = {
          name: item,
          fullPath,
          relativePath,
          isDirectory,
          depth,
        };

        allItems.push(fileItem);

        if (isDirectory) {
          // console.log(`${indent} DIR: ${item} (relative: ${relativePath})`);
          // recursively scan subdirectory
          await scanRecursive(fullPath, allItems, depth + 1);
        } else {
          // console.log(`${indent} FILE: ${item} (${stats.size} bytes, relative: ${relativePath})`);
        }
      } catch (statError) {
        console.log(`${indent} ERROR accessing: ${item}`);
      }
    }
  } catch (readError) {
    console.error(`${indent}ERROR reading directory: ${currentPath}`, readError);
  }
}

export async function scanFolderStructure(sourcePath: string): Promise<FolderStructure> {
  console.log(`starting recursive scan of ${sourcePath}`);

  const allItems: FileItem[] = [];

  /**
   * recursive helper function to traverse directory tree
   * @param {string} currentPath - Current directory being scanned
   * @param {number} depth - Current nesting level for logging indentation
   */

  // start recursive scan from root
  await scanRecursive(sourcePath, allItems);

  // separate files and directories for different processing
  const files = allItems.filter((item) => !item.isDirectory);
  const folders = allItems.filter((item) => item.isDirectory);

  // calculate unique folder paths that need to be created in sharepoint
  const folderPaths = new Set<string>();

  files.forEach((file) => {
    const dir = dirname(file.relativePath); // directory containing this file
    // if directory exists and is not root
    if (dir && dir !== '.' && dir !== '') {
      // split path into segments and add each parent directory
      const pathParts = dir.split('\\').filter((part) => part !== '');
      let currentPath = '';

      pathParts.forEach((part) => {
        currentPath = currentPath ? `${currentPath}\\${part}` : part;
        folderPaths.add(currentPath); // ensure all parent paths exist
      });
    }
  });

  // sort folder paths by depth so parent folders are created before children
  const sortedFolderPaths = Array.from(folderPaths).sort((a, b) => {
    const depthA = (a.match(/\\/g) || []).length; // count backslashes for depth
    const depthB = (b.match(/\\/g) || []).length;
    return depthA - depthB; // if negative a should come first, positive b should come first, 0 if equal (creates ascending order: shallow to deep)
  });

  return {
    files,
    folders,
    folderPaths: sortedFolderPaths,
  };
}
