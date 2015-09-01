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

wq = (robot, res, match) ->
  Wolfram.query match, (e, result) ->
    ans = result[1]['subpods'][0]['text']
    robot.logger.debug "Wolfram: #{Util.inspect ans}"

    if result and result.length > 0
      #result[1]['subpods'][0]['value']
      return res.reply "#{ans}"
    else
      return res.reply 'Hmm...not sure...'

module.exports = (robot) ->
  robot.respond /(question|wolfram|wfa) (.+)$/i, (msg) ->
    robot.logger.debug "Wolfram: #{msg.match[2]}"
    wq(robot, msg, msg.match[2])

  robot.catchAll (msg) ->
    r = new RegExp "^(?:#{robot.alias}|#{robot.name}) (.+)", "i"
    matches = msg.message.text.match(r)
    if matches != null && matches.length > 1
      robot.logger.debug "Catchall: #{matches[1]}"
      wq(robot, msg, matches[1])

    msg.finish()
