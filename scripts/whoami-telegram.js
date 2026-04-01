// Description:
//   whoami - ask hubot who you are
//
// Commands:
//   hubot whoami - tell me my telegram id and username
//
// Author:
//   iphoting

module.exports = (robot) => {
  robot.respond(/whoami$/i, (res) => {
    const user = res.envelope.user
    const name = user.name || `${user.first_name} ${user.last_name}`
    res.reply(`Hello ${name}. Your ID is ${user.id}.`)
  })
}
