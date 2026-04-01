// Description:
//   start - introduce itself
//
// Commands:
//   hubot start - introduce yourself
//
// Author:
//   iphoting

module.exports = (robot) => {
  robot.respond(/start$/i, (res) => {
    const user = res.envelope.user
    const name = user.name || `${user.first_name} ${user.last_name}`
    res.reply(`Hello ${name}. I am ${robot.name}.\nWhen speaking to me directly, you can skip my name.`)
    res.reply("Here are some of the things I can do:\n- whoami\n- image me <something>\n- stock chart SGX:ES3\n- is <domain> up?\n- pwqgen\n- roll\n- explainshell <shell command>\n- spark me <[1,2,3,2,1]>\n- tvshow me <showname>\n\nFor everything that I can do, use 'help' or 'help <filter>.")
  })
}
