#!/usr/bin/env node
/**
 * Smoke test: verifies the Telegram adapter can be imported and instantiated
 * as a proper subclass of hubot's Adapter. Catches TypeErrors like:
 *   "Class constructor Adapter cannot be invoked without 'new'"
 * which occur when a CJS adapter uses `_super.call(this)` against an ES6 class.
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
  listenerMiddleware: () => {},
  name: 'test',
}

const instance = telegramAdapter.use(mockRobot)

if (!(instance instanceof Adapter)) {
  throw new Error('adapter is not an Adapter instance — prototype chain is broken')
}

console.log('smoke test passed')
