const cluster     = require ('node:cluster')
const conf        = require ('./lib/Conf')
const logger      = require ('./lib/Logger.js') (conf)
const app         = new (require ('./lib/Application.js')) (conf, logger)

function exit () {

    logger.on ('finish', () => setTimeout (() => process.exit (0), 10)) 

    const todo = []
    
    if (app) todo.push (app.do ('close'))

    Promise.all (todo).then (
        () => logger.end (),
        () => process.exit (1)
    )

}

async function startWorkers () {

    return new Promise (ok => {

        let online = 0, onOnline = () => {

            if ((++ online < conf.workers)) return

            cluster.off ('online', onOnline)

            ok ()

        }

        cluster.on ('online', onOnline)

        for (let i = 0; i < conf.workers; i ++) cluster.fork ()

    })

}

async function main () {    
    
    if (cluster.isPrimary) {

        for (const signal of ['SIGTERM', 'SIGINT', 'SIGBREAK']) process.on (signal, exit)

        if (conf.workers > 0) await startWorkers ()

        await app.do ('init')

        app.start ()
    
    } 
    else {

        process.on ('message', request => app.process (request))
    
    }

}

main ().then (_=>_ , _ => console.log (_))