# Clean for parcel
A parcel plugin to remove/clean your build folder(s) before building
## Installation
npm
```
npm i parcel-plugin-clean-easy -D
```
yarn
```
yarn add parcel-plugin-clean-easy --dev
```
## Usage
```js
// package.json
{
  "parcelCleanPaths": []
}
```
### parcelCleanPaths (Required)
An [array] of string paths to clean
```js
[
  'dist',         // removes 'dist' folder
  'build/*.*',    // removes all files in 'build' folder
  'web/*.js'      // removes all JavaScript files in 'web' folder
]
```
### parcelCleanUnsafePaths (Optional)
Add this option to your package.json to allow the plugin cleaning outside folders.
