const process = require('node:process'), {ppid, pid} = process
const cluster = require ('node:cluster')
const {Application, JobSource} = require ('doix')
const Schedule = require ('./Schedule')
const {Tracker} = require ('events-to-winston')

const SRC_DEFAULT = 'def'
module.exports = class extends Application {

	constructor (conf, logger) {		

	    super ({
	    	
	    	logger,
	    
			globals: {

				conf,

				invoke:

					conf.workers === 0 ? 

						function (request) {this.app.process (request, {parent: this})} :

						function (request) {
						
							const workersOnline = Object.values (cluster.workers).filter (i => i.state === 'online'), {length} = workersOnline; if (length === 0) return

							const i = Math.floor (length * Math.random ())
							
							const worker = workersOnline [i]
					
							worker.send (request)

						}

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

		this [Tracker.LOGGING_ID] = cluster.isWorker ? `${ppid}/${pid}` : pid

		new JobSource (this, {name: SRC_DEFAULT})

	}

	start () {

		new Schedule (this, {name: 'sch'})

	}

	async do (action) {

		return this.jobSources.get (SRC_DEFAULT).createJob ({type: 'app', action}).outcome ()

	}

	process (request, options = {}) {

		this.jobSources.get (SRC_DEFAULT).createJob (request, options).outcome ().then (_=>_ , _=>_)

	}

}