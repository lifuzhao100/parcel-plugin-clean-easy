const fs = require('fs');
const os = require('os');
const path = require('path');
const rimraf = require('rimraf');

const pluginName = 'parcel-plugin-clean-easy';

// added node .10
// http://stackoverflow.com/questions/21698906/how-to-check-if-a-path-is-absolute-or-relative/30714706#30714706
function isAbsolute(dir) {
  return path.normalize(dir + path.sep) === path.normalize(path.resolve(dir) + path.sep);
}

function upperCaseWindowsRoot(dir) {
  const splitPath = dir.split(path.sep);
  splitPath[0] = splitPath[0].toUpperCase();
  return splitPath.join(path.sep);
}

function CleanPlugin(paths, options) {
  //backwards compatibility
  if (typeof options === 'string') {
    options = {
      root: options
    }
  }

  options = options || {};

  // determine webpack root
  options.root = options.root || path.dirname(module.parent.filename);

  // allows for a single string entry
  if (typeof paths == 'string' || paths instanceof String) {
    paths = [paths];
  }

  // store paths and options
  this.paths = paths;
  this.options = options;
}

const clean = function() {
  const _this = this;
  const results = [];
  let workingDir;
  let dirName;
  let projectRootDir;
  let parcelDir;

  // exit if no paths passed in
  if (_this.paths === void 0) {
    results.push({ path: _this.paths, output: 'nothing to clean' });
    return results;
  }

  if (!isAbsolute(_this.options.root)) {
    console.warn(
      'parcel-plugin-clean-easy: ' + _this.options.root +
      ' project root must be an absolute path. Skipping all...');
    results.push({ path: _this.options.root, output: 'project root must be an absolute path' });
    return results;
  }

  workingDir = process.cwd();
  dirName = __dirname;
  projectRootDir = path.resolve(_this.options.root);
  parcelDir = path.dirname(module.parent.filename);

  if (os.platform() === 'win32') {
    workingDir = upperCaseWindowsRoot(workingDir);
    dirName = upperCaseWindowsRoot(dirName);
    projectRootDir = upperCaseWindowsRoot(projectRootDir);
    parcelDir = upperCaseWindowsRoot(parcelDir);
  }

  // preform an rm -rf on each path
  _this.paths.forEach(function(rimrafPath) {
    rimrafPath = path.resolve(_this.options.root, rimrafPath);

    if (os.platform() === 'win32') {
      rimrafPath = upperCaseWindowsRoot(rimrafPath);
    }

    // disallow deletion any directories outside of root path.
    if (rimrafPath.indexOf(projectRootDir) < 0) {
      console.warn(
        'parcel-plugin-clean-easy: ' + rimrafPath + ' is outside of the project root. Skipping...');
      results.push({ path: rimrafPath, output: 'must be inside the project root' });
      return;
    }

    if (rimrafPath === projectRootDir) {
      console.warn(
          'parcel-plugin-clean-easy: ' + rimrafPath + ' is equal to project root. Skipping...');
      results.push({ path: rimrafPath, output: 'is equal to project root' });
      return;
    }

    if (rimrafPath === parcelDir) {
      console.warn('parcel-plugin-clean-easy: ' + rimrafPath + ' would delete webpack. Skipping...');
      results.push({ path: rimrafPath, output: 'would delete webpack' });
      return;
    }

    if (rimrafPath === dirName || rimrafPath === workingDir) {
      console.log('parcel-plugin-clean-easy: ' + rimrafPath + ' is working directory. Skipping...');
      results.push({ path: rimrafPath, output: 'is working directory' });
      return;
    }

    const childrenAfterExcluding = [];
    const excludedChildren = [];

    if (_this.options.exclude && _this.options.exclude.length) {
      try {
        const pathStat = fs.statSync(rimrafPath);
        if (pathStat.isDirectory()) {
          childrenAfterExcluding = fs.readdirSync(rimrafPath)
            .filter(function(childFile) {
              const include = _this.options.exclude.indexOf(childFile) < 0;
              if (!include) {
                excludedChildren.push(childFile);
              }
              return include;
            })
            .map(function(file) {
              const fullPath = path.join(rimrafPath, file);
              if (os.platform() === 'win32') {
                fullPath = upperCaseWindowsRoot(fullPath);
              }
              return fullPath;
            });
        }
        if (_this.options.exclude.indexOf('.') >= 0) {
          excludedChildren.push('.');
        }
      } catch (e) {
        childrenAfterExcluding = [];
      }
    }

    if (_this.options.exclude && excludedChildren.length) {
      childrenAfterExcluding.forEach(function(child) {
        rimraf.sync(child);
      });
    } else {
      rimraf.sync(rimrafPath);
    }

    console.warn('parcel-plugin-clean-easy: ' + rimrafPath + ' has been removed.');
    excludedChildren.length &&
      console.warn('parcel-plugin-clean-easy: ' + excludedChildren.length + ' file(s) excluded - ' + excludedChildren.join(', '));

    excludedChildren.length ?
      results.push({ path: rimrafPath, output: 'removed with exclusions (' + excludedChildren.length + ')' }) :
      results.push({ path: rimrafPath, output: 'removed' });
  });

  return results;
};

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
  clean.call(cleaner);
}
