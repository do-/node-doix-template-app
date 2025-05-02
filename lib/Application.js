const process = require('node:process'), {ppid, pid} = process
const cluster = require ('node:cluster')
const {Application, JobSource} = require ('doix')
const Schedule = require ('./Schedule')
const {Tracker} = require ('events-to-winston')

module.exports = class extends Application {

	constructor (conf, logger) {		

	    super ({
	    	
	    	logger,
	    
			globals: {
				conf,
			},

			pools: {
//				db: new DB (conf.db, logger),
			},

			modules: {
				dir: {
					root: [__dirname],
					filter: (_, arr) => arr.at (-1) === 'Content',
				},
				watch: true,
			},

			handlers: {

				error : function (error) {

					if (typeof error === 'string') error = Error (error)
					
					while (error.cause) error = error.cause

					// const m = /^#(.*?)#:(.*)/.exec (error.message); if (m) {
					// 	error.field   = m [1]
					// 	error.message = m [2].trim ()
					// }
					
					this.error = error

				},

			},

		})

		this.addJobSource ('default', JobSource)

	}

	addJobSource (name, clazz) {

		const jobSource = new clazz (this, {name})

		const prefix = cluster.isWorker ? `${ppid}/${pid}` : pid

		Object.defineProperty (jobSource, Tracker.LOGGING_ID, {value: `${prefix}/${name.substring (0, 3)}`, writable: false})

		this [name] = jobSource

	}

	start () {

		if (Object.keys (cluster.workers).length === 0) this.invoke = this.process

		this.addJobSource ('schedule', Schedule)

	}

	async do (action) {

		await this.default.createJob ({type: 'app', action}).outcome ()

	}

	process (request) {

		this.default.createJob (request).outcome ().then (_=>_ , _=>_)

	}

	invoke (request) {

        const workersOnline = Object.values (cluster.workers).filter (i => i.state === 'online'), {length} = workersOnline; if (length === 0) return

        const i = Math.floor (length * Math.random ())
        
        const worker = workersOnline [i]

        worker.send (request)

	}

}