# Description:
#   Foward unanswered requests to Wolfram Alpha
#
# Dependencies:
#   "wolfram-alpha": "^0.2.3"
#
# Configuration:
#   HUBOT_WOLFRAM_APPID
#
# Commands:
#   hubot question <question> - Searches Wolfram Alpha for the answer to the question
#   hubot wolfram <question> - Searches Wolfram Alpha for the answer to the question
#
# Author:
#   dhorrigan, wingrunr21, iphoting
#

Wolfram = require('wolfram-alpha').createClient(process.env.HUBOT_WOLFRAM_APPID)

Util = require 'util'

module.exports = (robot) ->
  robot.respond /(question|wolfram|wfa) (.+)$/i, (msg) ->
    robot.logger.debug "Wolfram: #{msg.match[2]}"
    Wolfram.query msg.match[2], (e, result) ->
      ans = result[1]['subpods'][0]['text']
      robot.logger.debug "Wolfram: #{Util.inspect ans}"

      if result and result.length > 0
        msg.reply ans
      else
        msg.reply 'Hmm...not sure...'

  robot.catchAll (msg) ->
    r = new RegExp "^(?:#{robot.alias}|#{robot.name}) (.+)", "i"
    matches = msg.message.text.match(r)
    if matches != null && matches.length > 1
      robot.logger.debug "Catchall: #{matches[1]}"
      Wolfram.query matches[1], (e, result) ->
        ans = result[1]['subpods'][0]['text']
        robot.logger.debug "Wolfram: #{Util.inspect ans}"

        if result and result.length > 0
          msg.send ans
        else
          msg.send 'Hmm...not sure...'
    msg.finish()
