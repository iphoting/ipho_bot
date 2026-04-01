// Description:
//   youtube-dl - get a downloadable link to the video on a video page.
//
// Configuration:
//   HUBOT_YOUTUBE_DL_API_URL
//
// Commands:
//   hubot youtube-dl <URL> - fetch the video download link
//   hubot tumdlr <URL> - fetch the video download link
//
// Author:
//   iphoting

const apiEndpoint = process.env.HUBOT_YOUTUBE_DL_API_URL || 'https://iphoting-yt-dl-api.herokuapp.com/'

module.exports = (robot) => {
  robot.respond(/(?:youtube-dl|tumdlr) (https?:\/\/[\\/\w.\-%#]+\/?)$/i, (res) => {
    robot.logger.debug(`Youtube-dl: ${JSON.stringify(res.match)}`)
    const url = new URL('api/info', apiEndpoint)
    url.searchParams.set('url', res.match[1])
    url.searchParams.set('flatten', 'false')
    fetch(url.toString(), { headers: { accept: 'application/json' } })
      .then((resp) => {
        if (!resp.ok) {
          const msg = resp.status === 400 ? 'Invalid Query' : resp.status === 500 ? 'Extraction failed' : `HTTP ${resp.status}`
          robot.logger.error(`Youtube-dl: ${msg}`)
          res.reply(`Backend encountered an error: ${msg}. Please try again later.`)
          return
        }
        return resp.json().then((parsed) => {
          const downloadUrl = parsed.info.url
          robot.logger.debug(`YouTube-dl version: ${parsed['youtube-dl.version']}`)
          res.reply(`The video link is ${downloadUrl}.`)
        })
      })
      .catch((err) => {
        robot.logger.error(`Youtube-dl: ${err}`)
        res.reply(`Backend encountered an error: ${err}. Please try again later.`)
      })
  })
}
