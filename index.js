const CleanPlugin = require('clean-webpack-plugin')
const path = require('path')
//just run once.
let times = 0;
module.exports = bundler => {
  times++;
  if(times > 1) return;
  const root = process.cwd()
  let pkgFile = {};
  try{
    pkgFile = require(path.resolve(root, 'package.json'))
  }catch(e){}

  const paths = pkgFile["parcelCleanPaths"] || [];
  let cleaner = new CleanPlugin(paths, {
    root: root
  });
  cleaner.apply();
}