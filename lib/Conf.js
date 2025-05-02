const fs      = require ('fs')
const path    = require ('path')
const process = require ('process')

const {argv} = process, noCluster = argv [3] === '--single'; if (argv.length !== 3 && !noCluster) throw Error (`Invalid command parameters. Usage: node ${path.basename (argv [1])} /path/to/config.json [--single]`)

const confPath = argv [2]; if (!fs.existsSync (confPath)) throw Error (`File not found: ${confPath}`)

const {size} = fs.statSync (confPath); if (size > 10000) throw Error (`Suspiciosly big config file ${confPath}: ${size} byte(s)`)

module.exports = {...JSON.parse (fs.readFileSync (confPath)), noCluster}