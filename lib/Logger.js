const fs      = require ('fs')
const Path    = require ('path')
const winston = require ('winston')
const {formatDetails, formatElapsed, formatPhase} = require ('events-to-winston')
const {Writable} = require ('node:stream')
const cluster = require ('node:cluster')
const process = require ('node:process')

module.exports = function (conf) {

    return winston.createLogger ({
        levels: winston.config.syslog.levels,
        transports: cluster.isWorker ? getWorkerTransport () : getPrimaryTransports (conf),
        format: winston.format.combine (
            winston.format.timestamp ({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
            formatElapsed (),
            formatPhase (),
            formatDetails (),
            winston.format.printf (info => `${info.timestamp} ${info.id} ${info.message}`)
            //winston.format.json ()
        ),
    })

}

function getPrimaryTransports (conf) {

    return [
        new winston.transports.Console (),
//        new winston.transports.File ({filename: getFileName (conf)}),
    ]

}

function getWorkerTransport () {

    return new winston.transports.Stream ({stream: new Writable ({objectMode: true, write: (info, _, cb) => {
        process.send (info)
        cb ()
    }})})

}

function getFileName (conf) {

    if (!('logs' in conf)) throw Error ('Invalid configuration: `logs` property not set')

    const {logs} = conf; if (typeof logs !== 'string' || logs.length === 0) throw Error ('Invalid `logs` configuration property: ' + logs)
            
    if (!fs.existsSync (logs)) throw Error (`Invalid "logs" configuration property: direcotory "${logs}" not found`)
    
    if (!fs.statSync (logs).isDirectory ()) throw Error (`Invalid "logs" configuration property: "${logs}" is not a direcotory`)
    
    const filename = Path.join (logs, 'app.log')
    
    try {

        fs.closeSync (fs.openSync (filename, 'a'))
        
        return filename

    }
    catch ({message}) {

        throw Error (`The logging directory "${logs}" is not writeable: ${message}`)

    }    

}