# Description:
#   Middleware filters auth requests for foursquare
#
# Configuration:
#    HUBOT_FOURSQUARE_ROLE
#
# Commands:
#
# Author:
#   iphoting
#

process.env.HUBOT_FOURSQUARE_ROLE || = 'foursquare'

PRIVATE_CMDS = [
  'foursquare.private'
]

module.exports = (robot) ->
  allowed = (msg) ->
    robot.auth.hasRole(msg.envelope.user, process.env.HUBOT_FOURSQUARE_ROLE)

  robot.respond /debug auth foursquare/i, id: 'foursquare.private', (res) ->
    if allowed (res)
      res.reply "Yes, you have #{process.env.HUBOT_FOURSQUARE_ROLE} role!"
    else
      res.reply "No, you do not have #{process.env.HUBOT_FOURSQUARE_ROLE} role!"

  robot.listenerMiddleware (context, next, done) ->
    try
      if context.listener.options.id in PRIVATE_CMDS
        unless allowed (context.response)
          context.response.reply "You are not authorised!"
          done()
        else
          next()
      else
        next()
    catch e
      robot.emit('error', err, context.response)
