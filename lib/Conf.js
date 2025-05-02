const fs      = require ('fs')
const path    = require ('path')
const process = require ('process')

const {argv} = process; if (argv.length !== 3) throw Error (`Invalid command parameters. Usage: node ${path.basename (argv [1])} /path/to/config.json`)

const confPath = argv [2]; if (!fs.existsSync (confPath)) throw Error (`File not found: ${confPath}`)

const {size} = fs.statSync (confPath); if (size > 10000) throw Error (`Suspiciosly big config file ${confPath}: ${size} byte(s)`)

const conf = JSON.parse (fs.readFileSync (confPath))

const N = require ('node:os').availableParallelism ()

if ('workers' in conf) {

    if (!Number.isSafeInteger (conf.workers) || conf.workers < 0) throw Error (`Invalid workers number: ${conf.workers}`)

    if (conf.workers > N) throw Error (`${conf.workers} workers required, but no more than ${N} make sense`)

}
else {

    conf.workers = N - 1

}

module.exports = conf