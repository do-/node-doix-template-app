const cluster = require ('node:cluster')
const {Application, JobSource} = require ('doix')
const Schedule = require ('./Schedule')

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

		this.default = new JobSource (this, {name: 'def'})

	}

	start () {

		if (Object.keys (cluster.workers).length === 0) this.invoke = this.process

		this.schedule = new Schedule (this, {name: 'sch'})

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