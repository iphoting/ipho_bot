// Description:
//   Chat interface backed by Claude AI (Anthropic)
//   Maintains per-user conversation history in the brain.
//
// Dependencies:
//   "@anthropic-ai/sdk": "^0.52.0"
//
// Configuration:
//   ANTHROPIC_API_KEY      - Anthropic API key (required)
//   HUBOT_LLM_MODEL        - Claude model to use (default: claude-haiku-4-5-20251001)
//   HUBOT_LLM_MAX_HISTORY  - Number of past messages to retain per user (default: 10)
//
// Commands:
//   hubot ask <message>  - Send a message to Claude AI
//   hubot clear chat     - Clear your conversation history
//
// Author:
//   iphoting

const Anthropic = require('@anthropic-ai/sdk')

const MAX_HISTORY = parseInt(process.env.HUBOT_LLM_MAX_HISTORY || '10')
const MODEL = process.env.HUBOT_LLM_MODEL || 'claude-haiku-4-5-20251001'
const client = new Anthropic()

const getHistory = (robot, userId) => robot.brain.get(`llm_history_${userId}`) || []
const saveHistory = (robot, userId, messages) => robot.brain.set(`llm_history_${userId}`, messages.slice(-MAX_HISTORY))

const askClaude = async (robot, userId, userMessage) => {
  const history = getHistory(robot, userId)
  history.push({ role: 'user', content: userMessage })
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: history
  })
  const assistantMessage = response.content[0].text
  history.push({ role: 'assistant', content: assistantMessage })
  saveHistory(robot, userId, history)
  return assistantMessage
}

module.exports = (robot) => {
  robot.respond(/ask (.+)$/i, (msg) => {
    const userId = msg.envelope.user.id
    const query = msg.match[1]
    robot.logger.debug(`LLM ask from ${userId}: ${query}`)
    askClaude(robot, userId, query)
      .then((ans) => msg.reply(ans))
      .catch((e) => {
        robot.logger.error(`LLM error: ${e}`)
        msg.reply('Sorry, I encountered an error talking to the AI.')
      })
  })

  robot.respond(/clear chat$/i, (msg) => {
    robot.brain.remove(`llm_history_${msg.envelope.user.id}`)
    msg.reply('Conversation history cleared.')
  })

  robot.catchAll((msg) => {
    const r = new RegExp(`^(?:${robot.alias}|${robot.name}) (.+)`, 'i')
    const matches = msg.message.text?.match(r)
    if (matches?.length > 1) {
      const userId = msg.envelope.user.id
      const query = matches[1]
      robot.logger.debug(`Catchall LLM from ${userId}: ${query}`)
      askClaude(robot, userId, query)
        .then((ans) => msg.send(ans))
        .catch((e) => {
          robot.logger.error(`LLM error: ${e}`)
          msg.send('Sorry, I encountered an error talking to the AI.')
        })
    }
    msg.finish()
  })
}
