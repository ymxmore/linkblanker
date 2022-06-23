const time = new Date().getTime();
const manifest = require('./dist/manifest');
const filename = (`${manifest.name}-v${manifest.version}-${time}.zip`)
    .replace(/\s/, '-')
    .toLowerCase();
const { execSync } = require('child_process');
const dirname = 'archive';

execSync(`cd ${__dirname} ; mkdir -p ./${dirname} ; zip -r ./${dirname}/${filename} ./dist `);
