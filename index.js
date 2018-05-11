const { join } = require('path');

const imageCluster = require('./src');
const compareDict = require('./src/compareDirs');

const DIR = join('D:', 'images');

// compareDict(DIR, join('D:', 'images__png'));

compareDict(DIR, join('D:', 'images__webp'));

// imageCluster(DIR, 'png');
// imageCluster(DIR, 'webp');
