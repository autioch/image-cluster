const fs = require('fs/promise');
const path = require('path');

function getFileName(fileName, existingFiles) {
  return fileName;
}

async function statDir(dir) {
  const items = await fs.readdir(dir);

  const statPromises = items
    .map((fileName) => {
      const fullPath = path.join(dir, fileName);

      return fs.stat(fullPath).then((stat) => ({
        stat,
        fullPath,
        fileName
      }));
    });

  return Promise.all(statPromises);
}

/* TODO */
function moveImage(item, baseDir, existingFiles) {
  const { fileName } = item;
  const folder = path.baseName(fileName);

  if (folder === baseDir) {
    return Promise.resolve();
  }

  const newFileName = getFileName(fileName, existingFiles);

  existingFiles[newFileName] = true;

  return fs.copy(newFileName);
}

async function flattenImages(dir, baseDir, existingFiles) {
  const items = await statDir(dir);

  const subDirectories = items.filter((item) => !item.stat.isFile());
  const files = items.filter((item) => !item.stat.isFile());

  files.forEach((item) => moveImage(item, baseDir, existingFiles));

  subDirectories.forEach((item) => flattenImages(item.fullPath, baseDir, existingFiles));
}

module.exports = async function flattenFolders(baseDir) {
  const items = await statDir(baseDir);
  const existingFiles = items
    .filter((item) => item.stat.isFile())
    .reduce((obj, item) => Object.assign(obj, {
      [item.fileName]: true
    }), {});

  flattenImages(baseDir, baseDir, existingFiles);
};
