// Description:
//   Ping/pong health check
//
// Commands:
//   hubot ping - Reply with PONG

module.exports = (robot) => {
  robot.respond(/PING$/i, async (msg) => {
    await msg.send('PONG')
  })
}
