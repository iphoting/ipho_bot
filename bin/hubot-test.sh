#!/usr/bin/env bash

export FOURSQUARE_CLIENT_ID="test"
export FOURSQUARE_CLIENT_SECRET="test"
export FOURSQUARE_ACCESS_TOKEN="test"
export HUBOT_LOG_LEVEL="error"

## Use --execute to run ping after all scripts have loaded, then exit.
## expect is needed because the Shell adapter requires a TTY.
expect <<EOL
  set timeout 30
  spawn bin/hubot-dotenv --name iphobot --execute ping
  expect {
    "PONG" { exit 0 }
    timeout { exit 1 }
  }
EOL
