#!/usr/bin/env node
/**
 * Smoke test: verifies the Telegram adapter can be imported, instantiated,
 * and started without runtime errors. Catches:
 *   - "Class constructor Adapter cannot be invoked without 'new'"
 *     (CJS adapter using `_super.call(this)` against an ES6 class)
 *   - "Incorrect number of arguments for middleware callback (expected 1, got N)"
 *     (old-style (context, next, done) middleware passed to hubot 14+)
 */

import { Adapter } from '../node_modules/hubot/index.mjs'
import telegramAdapter from '../adapters/telegram.mjs'

if (typeof telegramAdapter.use !== 'function') {
  throw new Error('adapter.use is not a function')
}

const mockRobot = {
  logger: { info: () => {}, debug: () => {}, warning: () => {} },
  on: () => {},
  brain: { userForId: (_id, u) => u },
  listenerMiddleware: (fn) => {
    if (fn.length !== 1) {
      throw new Error(`Incorrect number of arguments for middleware callback (expected 1, got ${fn.length})`)
    }
  },
  name: 'test',
}

process.env.TELEGRAM_TOKEN = 'test:token'
const instance = telegramAdapter.use(mockRobot)

if (!(instance instanceof Adapter)) {
  throw new Error('adapter is not an Adapter instance — prototype chain is broken')
}

// Mock bot API calls to avoid real network requests
instance.bot.getMe = () => Promise.resolve({ first_name: 'test' })
instance.bot.startPolling = () => {}

// Call run() to exercise middleware registration and startup path
await new Promise((resolve, reject) => {
  instance.on('connected', resolve)
  instance.on('error', (err) => reject(err))
  instance.run()
})

console.log('smoke test passed')
