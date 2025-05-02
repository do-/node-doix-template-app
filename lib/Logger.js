const fs      = require ('fs')
const Path    = require ('path')
const winston = require ('winston')
const cluster = require ('node:cluster')
const process = require('node:process'), {ppid, pid} = process, pids = cluster.isPrimary ? pid : `${ppid}/${pid}`
//const normalizeSpaceLogFormat = require ('string-normalize-space').logform

module.exports = conf => {

    if (!('logs' in conf)) throw Error ('Invalid configuration: `logs` property not set')

    const {logs} = conf; if (typeof logs !== 'string' || logs.length === 0) throw Error ('Invalid `logs` configuration property: ' + logs)
        
    if (!fs.existsSync (logs)) throw Error (`Invalid "logs" configuration property: direcotory "${logs}" not found`)

    if (!fs.statSync (logs).isDirectory ()) throw Error (`Invalid "logs" configuration property: "${logs}" is not a direcotory`)

    const filename = Path.join (logs, 'app.log')

    try {

        fs.closeSync (fs.openSync (filename, 'a'))

    }
    catch ({message}) {

        throw Error (`The logging directory "${logs}" is not writeable: ${message}`)

    }

    return winston.createLogger ({
        levels: winston.config.syslog.levels,
        transports: [
			new winston.transports.Console (),
//            new winston.transports.File ({filename})
        ],
        format: winston.format.combine (
            winston.format.timestamp ({format: 'YYYY-MM-DD HH:mm:ss.SSS'})
    //        , winston.format.json ()
    //        , normalizeSpaceLogFormat ()
            , winston.format.printf (info => {
                //`${info.timestamp} ${info.id} ${info.message??info.event}${info.elapsed ? ' ' + info.elapsed + ' ms' : ''}${info.details ? ' ' + JSON.stringify (info.details): ''}`
    
                let s = `${info.timestamp} ${pids}/${info.id}`
    
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