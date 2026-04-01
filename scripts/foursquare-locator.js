// Description:
//   Get last checkin of your bot's friends
//
// Dependencies:
//   "node-foursquare": "0.2.0"
//   "moment": "~2.5.0"
//
// Configuration:
//   FOURSQUARE_CLIENT_ID
//   FOURSQUARE_CLIENT_SECRET
//   FOURSQUARE_ACCESS_TOKEN
//
// Commands:
//   hubot foursquare - Shows list of recent checkins
//   hubot foursquare <user> as <user id> - Hints for the bot to locate a user
//   hubot foursquare forget <user> - Removes an existing hint to locate a user
//   hubot where is <user>? - Filters recent checkins to a particular subset of users
//   hubot where is everybody? - Shows list of recent checkins
//
// Authors:
//   stephenyeargin, jfryman, brandonvalentine, watson

const moment = require('moment')

module.exports = (robot) => {
  const config = {
    secrets: {
      clientId: process.env.FOURSQUARE_CLIENT_ID,
      clientSecret: process.env.FOURSQUARE_CLIENT_SECRET,
      accessToken: process.env.FOURSQUARE_ACCESS_TOKEN,
      redirectUrl: 'localhost'
    },
    version: '20140401'
  }

  robot.brain.data.foursquare = robot.brain.data.foursquare || {}

  let foursquare = null
  const getFoursquare = () => {
    if (!foursquare) foursquare = require('node-foursquare')(config)
    return foursquare
  }

  const formatName = (user) => {
    if (user.lastName) return `${user.firstName} ${user.lastName}`
    if (user.firstName) return user.firstName
    return '(No Name)'
  }

  const missingEnvironmentForApi = (msg) => {
    let missing = false
    if (!config.secrets.clientId) {
      msg.send('Foursquare API Client ID is missing: Ensure that FOURSQUARE_CLIENT_ID is set.')
      missing = true
    }
    if (!config.secrets.clientSecret) {
      msg.send('Foursquare API Client Secret is missing: Ensure that FOURSQUARE_CLIENT_SECRET is set.')
      missing = true
    }
    if (!config.secrets.accessToken) {
      msg.send('Foursquare API Access Token is missing: Ensure that FOURSQUARE_ACCESS_TOKEN is set.')
      missing = true
    }
    return missing
  }

  const friendActivity = (msg) => {
    getFoursquare().Checkins.getRecentCheckins({ limit: 5 }, config.secrets.accessToken, (error, response) => {
      for (const checkin of Object.values(response.recent)) {
        const userName = formatName(checkin.user)
        const timeFormatted = moment(new Date(checkin.createdAt * 1000)).fromNow()
        msg.send(`${userName} was at ${checkin.venue.name} ${checkin.venue.location.city || ''} ${checkin.venue.location.state || ''} ${timeFormatted}`)
      }
    })
  }

  robot.respond(/(?:foursquare|4sq|swarm)$/i, { id: 'foursquare.private' }, (msg) => {
    if (missingEnvironmentForApi(msg)) return
    friendActivity(msg)
  })

  robot.respond(/(?:foursquare|4sq|swarm) ([a-zA-Z0-9]+) as ([0-9]+)/i, (msg) => {
    const actor = msg.match[1] === 'me' ? msg.message.user.name : msg.match[1].trim()
    const userId = msg.match[2].trim()
    if (robot.brain.data.foursquare[actor]) {
      const previous = robot.brain.data.foursquare[actor]
      msg.send(`Cannot save ${actor} as ${userId} because it is already set to '${previous}'.`)
      msg.send(`Use \`${robot.name} foursquare forget ${actor}\` to set a new value.`)
      return
    }
    robot.brain.data.foursquare[actor] = userId
    msg.send(`Ok, I have ${actor} as ${userId} on Foursquare.`)
  })

  robot.respond(/(?:foursquare|4sq|swarm) forget ([a-zA-Z0-9]+)/i, (msg) => {
    const actor = msg.match[1].trim()
    if (robot.brain.data.foursquare[actor]) {
      const previous = robot.brain.data.foursquare[actor]
      delete robot.brain.data.foursquare[actor]
      msg.send(`I no longer know ${actor} as ${previous} on Foursquare.`)
      return
    }
    msg.send(`I don't know who ${actor} is on Foursquare.`)
  })

  robot.respond(/where[ ']i?s ([a-zA-Z0-9 ]+)(\?)?$/i, { id: 'foursquare.private' }, (msg) => {
    if (missingEnvironmentForApi(msg)) return
    const searchterm = msg.match[1].toLowerCase()

    if (searchterm === 'everyone' || searchterm === 'everybody') {
      friendActivity(msg)
    } else if (robot.brain.data.foursquare[searchterm]) {
      const userId = robot.brain.data.foursquare[searchterm]
      getFoursquare().Users.getUser(userId, config.secrets.accessToken, (error, response) => {
        if (error) { msg.send(error); return }
        const userName = formatName(response.user)
        const checkin = response.user.checkins.items[0]
        if (!checkin) { msg.send(`${userName} is nowhere to be found.`); return }
        const timeFormatted = moment(new Date(checkin.createdAt * 1000)).fromNow()
        msg.send(`${userName} was at ${checkin.venue.name} ${checkin.venue.location.city || ''} ${checkin.venue.location.state || ''} ${timeFormatted}`)
      })
    } else {
      getFoursquare().Checkins.getRecentCheckins({ limit: 100 }, config.secrets.accessToken, (error, response) => {
        let found = 0
        for (const checkin of Object.values(response.recent)) {
          const userName = formatName(checkin.user)
          if (userName.toLowerCase().includes(searchterm)) {
            const timeFormatted = moment(new Date(checkin.createdAt * 1000)).fromNow()
            msg.send(`${userName} was at ${checkin.venue.name} ${checkin.venue.location.city || ''} ${checkin.venue.location.state || ''} ${timeFormatted}`)
            found++
          }
        }
        if (found === 0) msg.send(`Could not find a recent checkin from ${searchterm}.`)
      })
    }
  })
}
