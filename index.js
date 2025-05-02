const process     = require ('process')
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

for (const signal of ['SIGTERM', 'SIGINT', 'SIGBREAK']) process.on (signal, exit)

async function main () {
    app = new Application (conf, logger)
    await app.do ('init')
    app.start ()
}

main ().then (_=>_ , _ => console.log (_))