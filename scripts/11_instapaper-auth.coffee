# Description:
#   Middleware filters auth requests for instapaper
#
# Configuration:
#    HUBOT_INSTAPAPER_ROLE
#
# Commands:
#
# Author:
#   iphoting
#

process.env.HUBOT_INSTAPAPER_ROLE || = 'instapaper'

PRIVATE_CMDS = [
  'instapaper.private'
]

module.exports = (robot) ->
  allowed = (msg) ->
    robot.auth.hasRole(msg.envelope.user, process.env.HUBOT_INSTAPAPER_ROLE)

  robot.respond /debug auth instapaper/i, id: 'instapaper.private', (res) ->
    if allowed (res)
      res.reply "Yes, you have #{process.env.HUBOT_INSTAPAPER_ROLE} role!"
    else
      res.reply "No, you do not have #{process.env.HUBOT_INSTAPAPER_ROLE} role!"

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
