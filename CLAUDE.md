# ipho_bot

A personal Hubot Telegram bot deployed on Dokku. Scripts are written in CoffeeScript and live in `scripts/`.

## Architecture

```
scripts/                  Custom CoffeeScript scripts loaded at startup
adapters/telegram.mjs     Custom ESM Telegram adapter (replaces hubot-telegram)
external-scripts.json     Third-party Hubot plugins to load
hubot-scripts.json        Built-in hubot-scripts package scripts to load
bin/hubot                 Startup script (runs npm install, then hubot)
Procfile                  Process definitions (web = Telegram adapter)
```

Brain storage uses Redis (`hubot-redis-brain`) with S3 fallback (`hubot-s3-brain`).

## Prerequisites

- Node.js 22.x
- A running Redis instance (for brain storage)
- The `expect` CLI tool (for running tests)

## Environment Variables

| Variable | Description |
|---|---|
| `TELEGRAM_TOKEN` | Telegram Bot API token (`HUBOT_TELEGRAM_TOKEN` accepted as legacy alias) |
| `ANTHROPIC_API_KEY` | Anthropic API key (for Claude AI catchall) |
| `HUBOT_LLM_MODEL` | Claude model to use (default: `claude-haiku-4-5-20251001`) |
| `HUBOT_LLM_MAX_HISTORY` | Per-user conversation turns to retain (default: `10`) |
| `REDIS_URL` | Redis connection URL (default: `redis://localhost:6379`) |
| `HUBOT_S3_BRAIN_ACCESS_KEY_ID` | AWS access key for S3 brain |
| `HUBOT_S3_BRAIN_SECRET_ACCESS_KEY` | AWS secret key for S3 brain |
| `HUBOT_S3_BRAIN_BUCKET` | S3 bucket name |
| `HUBOT_INSTAPAPER_USERNAME` | Instapaper username |
| `HUBOT_INSTAPAPER_PASSWORD` | Instapaper password |

Copy `.env.example` (if present) to `.env` — `dotenv` loads it automatically via `bin/hubot-dotenv`.

## Running Locally

```sh
# Install dependencies
npm install

# Telegram adapter — default when TELEGRAM_TOKEN is set (requires token)
bin/hubot

# Shell/console adapter (no Telegram token needed)
CI=1 bin/hubot
```

Once running, address the bot by name: `ipho_bot help`

## Testing

```sh
npm test
```

This runs `bin/hubot-test.sh` using the `expect` CLI tool. Requires the `HUBOT_S3_BRAIN_ACCESS_KEY_ID` and `HUBOT_S3_BRAIN_SECRET_ACCESS_KEY` env vars (or GitHub Actions secrets) to be set.

CI also runs `bin/smoke-test.mjs` to validate that the Telegram adapter starts cleanly (middleware signatures, class hierarchy).

## Adding Scripts

Create a `.coffee` or `.js` file in `scripts/`. It will be loaded automatically at startup.

```coffeescript
module.exports = (robot) ->
  robot.respond /hello/i, (res) ->
    res.reply 'Hi!'
```

To add an external plugin: install it (`npm install <pkg>`), add it to `external-scripts.json`, and commit both files.

## Updating Dependencies

```sh
npx npm-check-updates -u
npm install
```

Review the diff before committing — major version bumps may require script changes.

## Deployment

Pushing to `master` triggers the `deploy` GitHub Actions workflow, which force-pushes to the Dokku remote at `ssh://dokku@c.iphoting.cc:3022/iphobot`.

You can also push directly to the `dokku` branch to trigger a deploy without merging to master.

## Docker

```sh
docker build -t ipho_bot .
docker run --env-file .env ipho_bot
```

The multi-stage Dockerfile runs `npm ci` in a builder stage, then copies `node_modules` into a clean runtime image.
