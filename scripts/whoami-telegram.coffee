# Description:
#   whoami - ask hubot who you are
#
# Configuration:
#    none
#
# Commands:
#   hubot whoami - tell me my telegram id and username
#
# Author:
#   iphoting
#

module.exports = (robot) ->
  robot.respond /whoami$/i, (res) ->
    name = res.envelope.user.name || "#{res.envelope.user.first_name} #{res.envelope.user.last_name}"

    res.reply "Hello #{name}. Your ID is #{res.envelope.user.id}."
