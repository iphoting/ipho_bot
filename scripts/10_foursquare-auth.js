// Description:
//   Middleware filters auth requests for foursquare
//
// Configuration:
//   HUBOT_FOURSQUARE_ROLE
//
// Author:
//   iphoting

process.env.HUBOT_FOURSQUARE_ROLE = process.env.HUBOT_FOURSQUARE_ROLE || 'foursquare'

const PRIVATE_CMDS = ['foursquare.private']

module.exports = (robot) => {
  const allowed = (msg) => !robot.auth || robot.auth.hasRole(msg.envelope.user, process.env.HUBOT_FOURSQUARE_ROLE)

  robot.respond(/debug auth foursquare/i, { id: 'foursquare.private' }, (res) => {
    if (allowed(res)) {
      res.reply(`Yes, you have ${process.env.HUBOT_FOURSQUARE_ROLE} role!`)
    } else {
      res.reply(`No, you do not have ${process.env.HUBOT_FOURSQUARE_ROLE} role!`)
    }
  })

  robot.listenerMiddleware((context) => {
    try {
      if (PRIVATE_CMDS.includes(context.listener.options.id) && !allowed(context.response)) {
        context.response.reply('You are not authorised!')
        return false
      }
    } catch (e) {
      robot.emit('error', e, context.response)
    }
  })
}
