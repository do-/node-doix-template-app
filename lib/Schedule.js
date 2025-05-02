const {Queue} = require ('doix')

class Schedule extends Queue {

    constructor (app, options = {}) {

        options.cron = '* * * * * *'
        options.request = {type: 'app', action: 'tick'}
        
        super (app, options)

    }

    peek () {

        return {}

    }

	onJobNext () {

		// do nothing, cron only

	}

}

module.exports = Schedule