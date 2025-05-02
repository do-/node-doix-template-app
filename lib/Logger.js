const fs      = require ('fs')
const Path    = require ('path')
const winston = require ('winston')
const {Writable} = require ('node:stream')
const cluster = require ('node:cluster')
const process = require('node:process')//, {ppid, pid} = process, pids = cluster.isPrimary ? pid : `${ppid}/${pid}`
//const normalizeSpaceLogFormat = require ('string-normalize-space').logform

function getPrimaryTransports (conf) {

    return [
//        new winston.transports.Console (),
        new winston.transports.File ({filename: getFileName (conf)}),
    ]

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

function getTransports (conf) {

    if (cluster.isWorker) return [
        new winston.transports.Stream ({stream: new Writable ({objectMode: true, write: (o, _, cb) => {
            process.send (o)
            cb ()
        }})})
    ]

    return getPrimaryTransports (conf)

}

function getLogger (conf) {

    return winston.createLogger ({
        levels: winston.config.syslog.levels,
        transports: getTransports (conf),
        format: winston.format.combine (
            winston.format.timestamp ({format: 'YYYY-MM-DD HH:mm:ss.SSS'})
    //        , winston.format.json ()
    //        , normalizeSpaceLogFormat ()
            , winston.format.printf (info => {
    
                let s = `${info.timestamp} ${info.id}`
    
                const {event} = info
    
                switch (event) {
    
                    case 'finish':
                        if ('elapsed' in info) return s + ` < ${info.elapsed} ms`
                        break
    
                    case 'start':
                    case 'method':
                        s += ` >`
                        break
    
                }
    
                s += ` ${info.message??info.event}`
    
                if ('details' in info) {
                    try {
                        const d = JSON.stringify (info.details)
                        if (d != '{"params":[]}') s += ` ${d}`    
                    }
                    catch (x) {
                        s += ' [CIRCULAR]'
                    } 
                }
    
                return s
    
            })
        ),
    })

}

module.exports = getLogger