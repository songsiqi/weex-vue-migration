#!/usr/bin/env node

var program = require('commander')
var pkg = require('../package.json')
var migrater = require('../')
var chalk = require('chalk')
var path = require('path')
var fs = require('fs-extra')

program.version(pkg.version)
  .option('-o, --output [path]', 'the output file dirname')
  .parse(process.argv)

if (!program.args.length) {
  console.log(chalk.yellow.bold('[Info]: ') + 'No files to process!')
}
else {
  var EXT_NAME_LIST = ['.wx', '.wa', '.we']

  program.args.forEach(function (filePath) {
    var extName = path.extname(filePath)
    if (EXT_NAME_LIST.indexOf(extName) === -1) {
      return
    }

    var start = Date.now()
    var baseName = path.basename(filePath, extName) + '.vue'
    var dirName = path.dirname(filePath)
    var weexCode = fs.readFileSync(filePath, { encoding: 'utf8' })
    var vueCode = migrater.transform(weexCode)
    var outputPath = path.join(program.output || dirName, baseName)
    fs.createFileSync(outputPath)
    fs.writeFileSync(outputPath, vueCode, { encoding: 'utf8' })
    var end = Date.now()
    var info = chalk.green.bold('[Success]: ') +
      'Migrate ' + filePath +
      ' => ' + outputPath +
      ' in ' + (end - start) + 'ms'
    console.log(info)
  })
}
