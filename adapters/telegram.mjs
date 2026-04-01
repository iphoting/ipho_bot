'use strict'

/**
 * Custom Telegram adapter for Hubot 14 (ESM).
 *
 * Replaces hubot-telegram which uses TypeScript-compiled code that calls
 * `_super.call(this, robot)` — incompatible with hubot 14's ES6 Adapter class.
 */

import { createRequire } from 'node:module'
import { Adapter, TextMessage, EnterMessage, LeaveMessage, TopicMessage, Message, CatchAllMessage, User } from 'hubot'

// Suppress node-telegram-bot-api deprecation warning about promise cancellation
process.env.NTBA_FIX_319 = '1'

const require = createRequire(import.meta.url)
const TelegramBot = require('node-telegram-bot-api')

class TelegramAdapter extends Adapter {
  constructor (robot) {
    super(robot)
    this.token = process.env.TELEGRAM_TOKEN || ''
    this.interval = process.env.TELEGRAM_INTERVAL || '300'
    this.webhook = process.env.TELEGRAM_WEBHOOK || ''

    this.robot.logger.info(`Telegram Adapter Bot ${this.token} Loaded...`)

    this.bot = new TelegramBot(this.token, {
      polling: { autoStart: false, interval: this.interval }
    })

    this.handleUpdate = this.handleUpdate.bind(this)
  }

  createUser (user, chat) {
    const currentUser = new User(String(user.id), {
      ...user,
      name: user.username,
      room: chat?.id,
      telegram_chat: chat?.id
    })
    return this.robot.brain.userForId(String(user.id), currentUser)
  }

  cleanMessageText (text, chat_id) {
    if (chat_id > 0) {
      text = text.replace(/^\//g, '').trim()
      text = text.replace(new RegExp('^@?' + this.robot.name, 'gi'), '')
      if (this.robot.alias) {
        text = text.replace(new RegExp('^@?' + this.robot.alias, 'gi'), '')
      }
      text = this.robot.name + ' ' + text.trim()
    } else {
      text = text.trim()
    }
    return text
  }

  send (envelope, ...strings) {
    this.bot.sendMessage(envelope.room, strings.join(), envelope.telegram)
  }

  reply (envelope, ...strings) {
    this.bot.sendMessage(envelope.room, strings.join(), {
      reply_to_message_id: Number(envelope.message.id),
      ...envelope.telegram
    })
  }

  handleUpdate (message, metadata) {
    this.robot.logger.info(`Received text message in channel: ${message.chat.id}, from: ${message.from?.id}`)
    const messageId = String(message.message_id)
    const currentUser = message.from || {
      id: message.chat.id,
      is_bot: false,
      first_name: message.chat.first_name || String(message.chat.id)
    }
    const user = this.createUser(currentUser, message.chat)

    if (message.text) {
      this.robot.logger.debug(`Received message: ${currentUser.id} said '${message.text}'`)
      const text = this.cleanMessageText(message.text, message.chat.id)
      this.receive(new TextMessage(user, text, messageId))
    } else if (message.new_chat_members) {
      message.new_chat_members.forEach(u => {
        const member = this.createUser(u, message.chat)
        this.robot.logger.info(`User ${member.id} joined chat ${message.chat.id}`)
        this.receive(new EnterMessage(member, false))
      })
    } else if (message.left_chat_member) {
      const left = this.createUser(message.left_chat_member, message.chat)
      this.robot.logger.info(`User ${left.id} left chat ${message.chat.id}`)
      this.receive(new LeaveMessage(left, false))
    } else if (message.new_chat_title) {
      this.robot.logger.info(`User ${user.id} changed chat ${message.chat.id} title: ${message.new_chat_title}`)
      this.receive(new TopicMessage(user, message.new_chat_title, messageId))
    } else {
      const msg = new Message(user, false)
      this.receive(new CatchAllMessage(msg))
    }
  }

  run () {
    if (!this.token) {
      this.emit('error', new Error('The environment variable "TELEGRAM_TOKEN" is required.'))
      return
    }

    this.bot.getMe()
      .then(user => {
        this.robot.logger.info(`Telegram Bot Identified: ${user.first_name}`)
        if (user.first_name !== this.robot.name) {
          this.robot.logger.warning('It is advised to use the same bot name as your Telegram Bot: ' + user.username)
          this.robot.logger.warning('Having a different bot name can result in an inconsistent experience when using @mentions')
        }
      })
      .catch(err => this.emit('error', err))

    if (this.webhook) {
      const endpoint = this.webhook + '/' + this.token
      this.robot.logger.debug(`Listening on ${endpoint}`)
      this.bot.setWebHook(endpoint).catch(err => this.robot.emit('error', err))
      this.robot.router.post('/' + this.token, (req, res) => {
        this.bot.processUpdate(req.body)
        res.status(200).send({ ok: true })
      })
    } else {
      this.robot.logger.debug('Start polling APIs...')
      this.bot.startPolling()
    }

    // Allow other scripts to invoke Telegram API methods
    this.robot.on('telegram:invoke', (method, opts, cb) => {
      this.bot[method](opts).then(result => cb(null, result)).catch(err => cb(err))
    })

    // Expose the telegram bot instance on the robot
    this.robot.telegram = this.bot

    // Register events
    this.bot.on('error', err => this.emit('error', err))
    this.bot.on('message', this.handleUpdate)
    this.bot.on('channel_post', this.handleUpdate)

    // Register middleware to enrich Response with Telegram API methods
    this.robot.listenerMiddleware((context) => {
      const response = context.response
      response.sendMessage = this.bot.sendMessage.bind(this.bot)
      response.sendAnimation = this.bot.sendAnimation.bind(this.bot)
      response.sendPhoto = this.bot.sendPhoto.bind(this.bot)
      response.sendAudio = this.bot.sendAudio.bind(this.bot)
      response.sendDocument = this.bot.sendDocument.bind(this.bot)
      response.sendMediaGroup = this.bot.sendMediaGroup.bind(this.bot)
      response.sendSticker = this.bot.sendSticker.bind(this.bot)
      response.sendVideo = this.bot.sendVideo.bind(this.bot)
      response.sendVideoNote = this.bot.sendVideoNote.bind(this.bot)
      response.sendVoice = this.bot.sendVoice.bind(this.bot)
      response.sendChatAction = this.bot.sendChatAction.bind(this.bot)
    })

    this.robot.logger.info('Telegram Adapter Started...')
    this.emit('connected')
  }
}

export default {
  use (robot) {
    return new TelegramAdapter(robot)
  }
}
