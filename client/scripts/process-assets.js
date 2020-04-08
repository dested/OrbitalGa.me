let glob = require('glob');
let fs = require('fs');
const prettier = require('prettier');
var sizeOf = require('image-size');

var readJson = (path, cb) => {
  fs.readFile(require.resolve(path), (err, data) => {
    if (err) cb(err);
    else cb(JSON.parse(data));
  });
};

process.chdir('./src');

// options is optional
glob('assets/**/*', {}, (er, files) => {
  let pieces = [];
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    if (
      !file.endsWith('.png') &&
      !file.endsWith('.jpg') &&
      !file.endsWith('.json') &&
      !file.endsWith('.svg') &&
      !file.endsWith('.jpeg')
    )
      continue;
    let piece = [
      file,
      ...file
        .replace('.png', '')
        .replace('.jpeg', '')
        .replace('.jpg', '')
        .replace('.json', '')
        .replace('.svg', '')
        .replace('assets/', '')
        .replace('src/', '')
        .split('/'),
    ];
    pieces.push(piece);
  }

  let assets = {};
  let assetKeys = [];
  for (let p = 0; p < pieces.length; p++) {
    let piece = pieces[p];
    let curPiece = assets;
    let parent = piece[0];
    for (let i = 1; i < piece.length; i++) {
      let item = piece[i].replace(/-/g, '_').replace(/ /g, '_');
      if (i === piece.length - 1) {
        assetKeys.push("'" + parent + '.' + item + "'");
        curPiece[parent + '.' + item ] = `require('./${piece[0]}')`;
      } else {
        parent = item;
      }
    }
  }

  let result = JSON.stringify(assets, null, '    ').replace(/"require\('(.*)'\)"/g, (_, value) => {
    var dimensions = sizeOf(value);

    return "{asset: require('" + value + "'), width: " + dimensions.width + ', height: ' + dimensions.height + '}';
  });

  readJson('../.prettierrc', (p) => {
    p.parser = 'typescript';
    let prettyResult = prettier.format(
      'export type AssetKeys=' +
        assetKeys.join('|') +
        ';export const Assets:' +
        "{[key in AssetKeys]: {asset: Promise<typeof import('*.png')>; height: number; width: number}} = " +
        result +
        ';',
      p
    );
    fs.writeFileSync('./assets.ts', prettyResult);
    console.log(`Updated assets.ts with ${pieces.length} images.`);
  });
});
