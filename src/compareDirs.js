const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const path = require('path');

function arrToObj(arr) {
  return arr.reduce((obj, item) => {
    obj[item] = true;

    return obj;
  }, {});
}

async function getFolderData(dir) {
  const arr = await fs.readdirAsync(dir);
  const cleanArr = arr.map((item) => path.basename(item, path.extname(item)));

  const dict = arrToObj(cleanArr);

  return {
    dict,
    arr: cleanArr
  };
}

function getItems(arr, dict) {
  return arr.filter((item) => !dict[item]);
}

module.exports = async function compareDirs(baseDir, targetDir) {
  const base = await getFolderData(baseDir);
  const target = await getFolderData(targetDir);

  console.log('Not copied items:');
  console.log(getItems(base.arr, target.dict));
  console.log('New items:');
  console.log(getItems(target.arr, base.dict));
};
