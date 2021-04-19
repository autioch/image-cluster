const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const path = require('path');
const sharp = require('sharp');

async function getImages(dir) {
  const items = await fs.readdirAsync(dir);

  const statPromises = items

    // .filter((fileName) => !fileName.endsWith('gif'))
    .map((fileName) => fs.statAsync(path.join(dir, fileName)).then((stat) => ({
      stat,
      fileName
    })));

  const stated = await Promise.all(statPromises);

  return stated.filter((item) => item.stat.isFile());
}

function getNewName(newDir, rawName, format) {
  let newName = path.join(newDir, `${rawName}.${format}`);
  let counter = 1;

  while (fs.existsSync(newName)) {
    counter = counter + 1;
    newName = path.join(newDir, `${rawName} (${counter}).${format}`);
  }

  return newName;
}

function copyPng(image, oldDir, newDir, format) {
  const oldName = path.join(oldDir, image);
  const rawName = path.basename(image, path.extname(image));
  const newName = getNewName(newDir, rawName, format);

  return sharp(oldName).toFile(newName);
}

module.exports = async function clusterImages(dir, format) {
  const images = await getImages(dir);
  const newDir = path.resolve(dir, '..', `${dir.split(path.sep).pop()}__${format}`);

  const copyPromises = images.map((image) => copyPng(image.fileName, dir, newDir, format));

  await Promise.all(copyPromises);

  console.log('done');
};
