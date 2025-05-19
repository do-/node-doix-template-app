const fs      = require ('fs')
const Path    = require ('path')
const winston = require ('winston')
const {formatDetails, formatElapsed, formatPhase} = require ('events-to-winston')

require ('cluster-to-winston')

module.exports = function (conf) {

    const logger = winston.createLogger ({
        transports: [
            new winston.transports.Console (),
            new winston.transports.File ({filename: getFileName (conf)}),
        ],
        format: winston.format.combine (
            winston.format.timestamp ({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
            formatElapsed (),
            formatPhase (),
            formatDetails (),
            winston.format.printf (info => `${info.timestamp} ${info.id} ${info.message}`)
            //winston.format.json ()
        ),
    })
    
    if (conf.workers > 0) logger.enableCluster ()

    return logger

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