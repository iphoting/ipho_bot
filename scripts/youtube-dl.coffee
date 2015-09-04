# Description:
#   youtube-dl - get a downloadable link to the video on a video page.
#
# Configuration:
#    HUBOT_YOUTUBE_DL_API_URL
#
# Commands:
#   hubot youtube-dl <URL> - fetch the video download link
#   hubot tumdlr <URL> - fetch the video download link
#
# Author:
#   iphoting
#

Util = require 'util'
api_endpoint = process.env.HUBOT_YOUTUBE_DL_API_URL || 'https://iphoting-yt-dl-api.herokuapp.com/'

module.exports = (robot) ->
  robot.respond /(?:youtube-dl|tumdlr) (https?:\/\/[\/\w\.\-%#]+\/?)$/i, (res) ->
    robot.logger.debug "Youtube-dl: #{Util.inspect res.match}"

    res.http(api_endpoint).path('api/info').header('accept', 'application/json')
      .query
        url: res.match[1]
        flatten: false
      .get() (err, resp, body) ->
        if err || resp.statusCode != 200
          msg = err || switch resp.statusCode
            when 400
              "Invalid Query"
            when 500
              "Extraction failed"

          robot.logger.error "Youtube-dl: #{msg}"
          res.reply "Backend encountered an error: #{msg}. Please try again later."
        else
          parsed = JSON.parse(body)
          url = parsed['info']['url']
          version = parsed['youtube-dl.version']
          robot.logger.debug "YouTube-dl version: #{version}"
          res.reply "The video link is #{url}."
