#!/usr/bin/env node

var program = require('commander')
var pkg = require('../package.json')
var migrator = require('../')
var chalk = require('chalk')
var path = require('path')
var fs = require('fs-extra')

function walkDir (filePath, entryPaths) {
  var stat = fs.statSync(filePath)
  if (stat.isDirectory()) {
    var children = fs.readdirSync(filePath) || []
    children.forEach(function (child) {
      walkDir(path.join(filePath, child), entryPaths)
    })
  }
  else {
    processFile(filePath, entryPaths)
  }
}

function processFile (filePath, entryPaths) {
  var extName = path.extname(filePath)
  if (extName !== '.we') {
    return
  }

  var start = Date.now()
  var weexCode = fs.readFileSync(filePath, { encoding: 'utf8' })
  var absoluteFilePath = path.resolve(process.cwd(), filePath)
  var isEntry = entryPaths.indexOf(absoluteFilePath) > -1
  var result = migrator.transform(weexCode, isEntry)

  var baseName = path.basename(filePath, extName) + '.vue'
  var dirName = path.dirname(filePath)
  if (dirName !== '.' && program.output !== '.') {
    dirName = dirName.replace(/^.*?(\/|$)/, '')
  }
  var outputPath = path.join(program.output, dirName, baseName)
  fs.createFileSync(outputPath)
  fs.writeFileSync(outputPath, result.content, { encoding: 'utf8' })

  result.elements.forEach((element) => {
    var baseName = path.join(migrator.ELEMENT_PATH, element.name + '.vue')
    var outputPath = path.join(program.output, dirName, baseName)
    fs.createFileSync(outputPath)
    fs.writeFileSync(outputPath, element.content, { encoding: 'utf8' })
  })

  var end = Date.now()
  var info = chalk.green.bold('[Success]: ') +
    'Migrate ' + filePath +
    ' => ' + outputPath +
    ' in ' + (end - start) + 'ms'
  console.log(info)
}

function migrate () {
  program.version(pkg.version)
    .option('-e, --entry [path]', 'entry files, separated by comma `,`', '')
    .option('-o, --output [path]', 'output file dirname, default: .', '.')
    .parse(process.argv)

  var start = Date.now()
  if (!program.args.length) {
    console.log(chalk.yellow.bold('[Info]: ') + 'No files to process!')
  }
  else {
    var entryPaths = program.entry ? program.entry.split(',') : []
    entryPaths = entryPaths.map((filePath) => {
      return path.resolve(process.cwd(), filePath)
    })
    program.args.forEach(function (filePath) {
      walkDir(filePath, entryPaths)
    })
  }
  var end = Date.now()
  var info = chalk.green.bold('Migration finished in ' +
    (end - start) / 1000 + 's')
  console.log(info)
}

migrate()
