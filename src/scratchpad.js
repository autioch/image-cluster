const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const { join, extname, basename } = require('path');
const sizeOf = Bluebird.promisify(require('image-size'));
const { groupBy, uniq } = require('lodash');
const sharp = require('sharp');

const HALF = 0.5;

async function getImages(dir) {
  const items = await fs.readdirAsync(dir);

  const statPromises = items.map((item) => fs.statAsync(join(dir, item)).then((stat) => ({
    stat,
    item
  })));

  const stated = await Promise.all(statPromises);

  return stated.filter((item) => item.stat.isFile());
}

function measureImage(image, dir) {
  return sizeOf(join(dir, image.item)).then(({ width, height }) => ({
    image: image.item,
    width,
    height,
    ratio: width / height,
    roundRatio: (((width / height) / HALF).toFixed() * HALF).toFixed(1)
  }));
}

function convertToPng(image, dir) {
  const oldName = join(dir, image);
  let base = basename(image, extname(image));

  if (fs.existsSync(join(dir, `${base}.png`))) { // eslint-disable-line no-sync
    base += new Date().toTimeString().substr(0, 8)
      .replace(/:/gi, '-');
  }

  const newName = join(dir, `${base}.png`);

  console.log('Convert', oldName, newName);

  return sharp(join(dir, image)).toFile(newName).then(() => fs.unlinkAsync(oldName));
}

module.exports = async function clusterImages(dir) {
  const images = await getImages(dir);
  const imageSizes = await Promise.all(images.map((image) => measureImage(image, dir)));

  const groupings = Object
    .entries(groupBy(imageSizes, 'roundRatio'))
    .map(([ratio, arr]) => ({
      ratio,
      images: arr,
      count: arr.length
    }));

  const ratios = uniq(imageSizes.map((image) => image.ratio.toFixed(1))).sort();
  const nonPngs = images.filter((image) => !image.item.endsWith('.png')).map((image) => image.item);

  const conversions = nonPngs.slice(0, 10).map((image) => convertToPng(image, dir));

  await Promise.all(conversions);

  console.log('Image count', images.length);
  console.log('Non pngs count', nonPngs.length);

  await fs.writeFileAsync('result.json', JSON.stringify(groupings, null, '  '));
  await fs.writeFileAsync('ratios.json', JSON.stringify(ratios, null, '  '));
  await fs.writeFileAsync('nonPngs.json', JSON.stringify(nonPngs, null, '  '));

  console.log('done');
};
