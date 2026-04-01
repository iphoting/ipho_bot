'use strict';

// Vendored from https://github.com/lukefx/hubot-telegram
// Modifications:
//   - Read HUBOT_TELEGRAM_TOKEN (with TELEGRAM_TOKEN as fallback)
//   - Use require('hubot') directly instead of require.main.require('hubot')

const Hubot = require('hubot');
const { TextMessage } = require('hubot');
const TelegramBot = require('node-telegram-bot-api');
const legacyTelegrambot = require('telegrambot');

function telegramMiddleware(adapter) {
  return function (context, next, done) {
    if (context.response) {
      context.response.telegram = function (opts) {
        context.response.envelope.telegram = opts;
        return context.response;
      };
    }
    next(done);
  };
}

class TelegramAdapter extends Hubot.Adapter {
  constructor(robot) {
    super(robot);
    this.robot = robot;
    this.token = process.env['HUBOT_TELEGRAM_TOKEN'] || process.env['TELEGRAM_TOKEN'] || '';
    this.interval = process.env['TELEGRAM_INTERVAL'] || '300';
    this.webhook = process.env['TELEGRAM_WEBHOOK'] || '';
    this.robot.logger.info(`Telegram Adapter Bot loaded...`);
    this.bot = new TelegramBot(this.token, {
      polling: { autoStart: false, interval: this.interval }
    });
    this.handleUpdate = this.handleUpdate.bind(this);
  }

  send(envelope, ...strings) {
    this.bot.sendMessage(envelope.room, strings.join(), envelope.telegram);
  }

  reply(envelope, ...strings) {
    this.bot.sendMessage(envelope.room, strings.join(), {
      reply_to_message_id: Number(envelope.message.id),
      ...envelope.telegram
    });
  }

  createUser(user, chat) {
    const currentUser = new Hubot.User(String(user.id), {
      ...user,
      name: user.username,
      room: chat && chat.id,
      telegram_chat: chat && chat.id
    });
    return this.robot.brain.userForId(String(user.id), currentUser);
  }

  cleanMessageText(text, chat_id) {
    if (chat_id > 0) {
      text = text.replace(/^\//g, '').trim();
      text = text.replace(new RegExp('^@?' + this.robot.name, 'gi'), '');
      if (this.robot.alias) {
        text = text.replace(new RegExp('^@?' + this.robot.alias, 'gi'), '');
      }
      text = this.robot.name + ' ' + text.trim();
    } else {
      text = text.trim();
    }
    return text;
  }

  handleUpdate(message) {
    this.robot.logger.info(
      `Received text message in channel: ${message.chat.id}, from: ${message.from && message.from.id}`
    );

    const messageId = String(message.message_id);
    const currentUser = message.from || {
      id: message.chat.id,
      is_bot: false,
      first_name: message.chat.first_name || String(message.chat.id)
    };
    const user = this.createUser(currentUser, message.chat);

    if (message.text) {
      this.robot.logger.debug(
        `Received message: ${currentUser.id} said '${message.text}'`
      );
      const text = this.cleanMessageText(message.text, message.chat.id);
      this.receive(new TextMessage(user, text, messageId));
    } else if (message.new_chat_members) {
      message.new_chat_members.forEach(u => {
        const member = this.createUser(u, message.chat);
        this.robot.logger.info(`User ${member.id} joined chat ${message.chat.id}`);
        this.receive(new Hubot.EnterMessage(member, false));
      });
    } else if (message.left_chat_member) {
      const leaver = this.createUser(message.left_chat_member, message.chat);
      this.robot.logger.info(`User ${leaver.id} left chat ${message.chat.id}`);
      this.receive(new Hubot.LeaveMessage(leaver, false));
    } else if (message.new_chat_title) {
      this.robot.logger.info(
        `User ${user.id} changed chat ${message.chat.id} title: ${message.new_chat_title}`
      );
      this.receive(new Hubot.TopicMessage(user, message.new_chat_title, messageId));
    } else {
      const msg = new Hubot.Message(user, false);
      this.receive(new Hubot.CatchAllMessage(msg));
    }
  }

  run() {
    if (!this.token) {
      this.emit(
        'error',
        new Error('The environment variable "HUBOT_TELEGRAM_TOKEN" is required.')
      );
      return;
    }

    this.bot
      .getMe()
      .then(user => {
        this.robot.logger.info(`Telegram Bot Identified: ${user.first_name}`);
        if (user.username !== this.robot.name) {
          this.robot.logger.warning(
            'It is advised to use the same bot name as your Telegram Bot: ' + user.username
          );
        }
      })
      .catch(err => this.emit('error', err));

    if (this.webhook) {
      const endpoint = this.webhook + '/' + this.token;
      this.robot.logger.debug(`Listening on ${endpoint}`);
      this.bot.setWebHook(endpoint).catch(err => this.robot.emit('error', err));
      this.robot.router.post(`/${this.token}`, (req, res) => {
        this.bot.processUpdate(req.body);
        res.status(200).send({ ok: true });
      });
    } else {
      this.robot.logger.debug('Start polling APIs...');
      this.bot.startPolling();
    }

    this.robot.on('telegram:invoke', (method, opts, cb) => {
      const api = new legacyTelegrambot(this.token);
      api.invoke(method, opts, cb);
    });

    this.robot.telegram = this.bot;

    this.bot.on('error', err => this.emit('error', err));
    this.bot.on('message', this.handleUpdate);
    this.bot.on('channel_post', this.handleUpdate);

    this.robot.logger.info('Telegram Adapter Started...');
    this.emit('connected');
  }
}

module.exports.use = (robot) => {
  const adapter = new TelegramAdapter(robot);
  robot.listenerMiddleware(telegramMiddleware(adapter));
  return adapter;
};
