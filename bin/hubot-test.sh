#!/usr/bin/env bash

export FOURSQUARE_CLIENT_ID="test"
export FOURSQUARE_CLIENT_SECRET="test"
export FOURSQUARE_ACCESS_TOKEN="test"
export HUBOT_S3_BRAIN_BUCKET="iphobot"
export HUBOT_LOG_LEVEL="debug"
export HUBOT_S3_BRAIN_SAVE_INTERVAL=3600

## start
expect <<EOL
  set timeout 30
  spawn bin/hubot-dotenv --name iphobot
  # workaround for current hubot which does not show prompt until pressed enter
  # so we simulate it once 'INFO hubot-redis-brain: Using default redis on localhost:6379' appears
  expect "Saved brain"
  send "\r"
  expect "iphobot> "
  send "iphobot ping\r"
  expect {
    "PONG" {}
    timeout {exit 1}
  }
EOL
