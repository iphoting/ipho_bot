# Description:
#   Forward unanswered requests to Wolfram Alpha
#
# Dependencies:
#   none (uses Node.js built-in fetch)
#
# Configuration:
#   HUBOT_WOLFRAM_APPID
#
# Commands:
#   hubot question <question> - Searches Wolfram Alpha for the answer to the question
#   hubot wolfram <question> - Searches Wolfram Alpha for the answer to the question
#   hubot wfa <question> - Searches Wolfram Alpha for the answer to the question
#
# Author:
#   dhorrigan, wingrunr21, iphoting
#

queryWolfram = (appid, query) ->
  url = "https://api.wolframalpha.com/v2/query?appid=#{encodeURIComponent(appid)}&input=#{encodeURIComponent(query)}&format=plaintext&output=JSON"
  fetch(url)
    .then (res) -> res.json()
    .then (data) ->
      pods = data?.queryresult?.pods
      if pods?.length > 1
        pods[1]?.subpods?[0]?.plaintext or 'Hmm...not sure...'
      else if pods?.length > 0
        pods[0]?.subpods?[0]?.plaintext or 'Hmm...not sure...'
      else
        'Hmm...not sure...'

module.exports = (robot) ->
  appid = process.env.HUBOT_WOLFRAM_APPID

  robot.respond /(question|wolfram|wfa) (.+)$/i, (msg) ->
    query = msg.match[2]
    robot.logger.debug "Wolfram: #{query}"
    queryWolfram(appid, query)
      .then (ans) ->
        robot.logger.debug "Wolfram answer: #{ans}"
        msg.reply ans
      .catch (e) ->
        robot.logger.error "Wolfram error: #{e}"
        msg.reply 'Hmm...not sure...'

  robot.catchAll (msg) ->
    r = new RegExp "^(?:#{robot.alias}|#{robot.name}) (.+)", "i"
    matches = msg.message.text?.match(r)
    if matches?.length > 1
      query = matches[1]
      robot.logger.debug "Catchall Wolfram: #{query}"
      queryWolfram(appid, query)
        .then (ans) ->
          robot.logger.debug "Wolfram answer: #{ans}"
          msg.send ans
        .catch (e) ->
          robot.logger.error "Wolfram error: #{e}"
          msg.send 'Hmm...not sure...'
    msg.finish()
