const cluster     = require ('node:cluster')
const process     = require ('node:process')
const conf        = require ('./lib/Conf')
const logger      = require ('./lib/Logger.js') (conf)
const Application = require ('./lib/Application.js')

let app; 

function exit () {

    logger.on ('finish', () => setTimeout (() => process.exit (0), 10)) 

    const todo = []
    
    if (app) todo.push (app.do ('close'))

    Promise.all (todo).then (
        () => logger.end (),
        () => process.exit (1)
    )

}

async function main () {    
    
    app = new Application (conf, logger)

    if (cluster.isPrimary) {

        for (const signal of ['SIGTERM', 'SIGINT', 'SIGBREAK']) process.on (signal, exit)

        cluster.on ('message', (w, o) => {if ('message' in o && 'level' in o) logger.log (o)})

        let N = require ('node:os').availableParallelism (); if (N > 1) N --

        await new Promise (ok => {

            let online = 0, onOnline = () => {

                if ((++ online < N)) return

                cluster.off ('online', onOnline)

                ok ()

            }

            cluster.on ('online', onOnline)

            for (let i = 0; i < N; i ++) cluster.fork ()

        })

        await app.do ('init')

        app.start ()
    
    } 
    else {

        process.on ('message', request => app.process (request))
    
    }
    
}

main ().then (_=>_ , _=>_)