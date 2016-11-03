#!/usr/bin/env node

var program = require('commander')
var pkg = require('../package.json')
var migrater = require('../')
var chalk = require('chalk')
var path = require('path')
var fs = require('fs-extra')

function walkDir (filePath) {
  var stat = fs.statSync(filePath)
  if (stat.isDirectory()) {
    var children = fs.readdirSync(filePath) || []
    children.forEach(function (child) {
      walkDir(path.join(filePath, child))
    })
  }
  else {
    processFile(filePath)
  }
}

function processFile (filePath) {
  var extName = path.extname(filePath)
  if (extName !== '.we') {
    return
  }

  var start = Date.now()
  var baseName = path.basename(filePath, extName) + '.vue'
  var dirName = path.dirname(filePath)
  var weexCode = fs.readFileSync(filePath, { encoding: 'utf8' })
  var vueCode = migrater.transform(weexCode)
  var outputPath = path.join(program.output || '.', dirName, baseName)
  fs.createFileSync(outputPath)
  fs.writeFileSync(outputPath, vueCode, { encoding: 'utf8' })
  var end = Date.now()
  var info = chalk.green.bold('[Success]: ') +
    'Migrate ' + filePath +
    ' => ' + outputPath +
    ' in ' + (end - start) + 'ms'
  console.log(info)
}

function migrate () {
  program.version(pkg.version)
    .option('-o, --output [path]', 'the output file dirname')
    .parse(process.argv)

  var start = Date.now()
  if (!program.args.length) {
    console.log(chalk.yellow.bold('[Info]: ') + 'No files to process!')
  }
  else {
    program.args.forEach(function (filePath) {
      walkDir(filePath)
    })
  }
  var end = Date.now()
  var info = chalk.green.bold('Migration finished in ' +
    (end - start) / 1000 + 's')
  console.log(info)
}

migrate()
