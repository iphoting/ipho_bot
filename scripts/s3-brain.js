// Description:
//   S3 brain persistence — backs up the Hubot brain to S3 using AWS SDK v3.
//   Coexists with hubot-redis-brain (S3 is backup/fallback only).
//
// Configuration:
//   HUBOT_S3_BRAIN_ACCESS_KEY_ID     - AWS access key (required)
//   HUBOT_S3_BRAIN_SECRET_ACCESS_KEY - AWS secret key (required)
//   HUBOT_S3_BRAIN_BUCKET            - S3 bucket name (required)
//   HUBOT_S3_BRAIN_KEY               - S3 object key (default: hubot-brain.json)
//   HUBOT_S3_BRAIN_REGION            - AWS region (default: us-east-1)
//
// Author:
//   iphoting

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')

const SAVE_INTERVAL_MS = 30 * 60 * 1000

module.exports = (robot) => {
  const bucket          = process.env.HUBOT_S3_BRAIN_BUCKET
  const accessKeyId     = process.env.HUBOT_S3_BRAIN_ACCESS_KEY_ID
  const secretAccessKey = process.env.HUBOT_S3_BRAIN_SECRET_ACCESS_KEY
  const key    = process.env.HUBOT_S3_BRAIN_KEY    || 'hubot-brain.json'
  const region = process.env.HUBOT_S3_BRAIN_REGION || 'us-east-1'

  if (!bucket || !accessKeyId || !secretAccessKey) {
    robot.logger.info('s3-brain: required env vars not set, skipping.')
    return
  }

  const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })
  let saveTimer = null

  const saveToS3 = async () => {
    try {
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(robot.brain.data),
        ContentType: 'application/json',
      }))
      robot.logger.debug(`s3-brain: saved to s3://${bucket}/${key}`)
    } catch (err) {
      robot.logger.error(`s3-brain: save failed: ${err}`)
    }
  }

  const loadFromS3 = async () => {
    try {
      const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      const chunks = []
      for await (const chunk of res.Body) chunks.push(chunk)
      const data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      // Merge as fallback: only fill keys not already present from Redis
      for (const [k, v] of Object.entries(data)) {
        if (!(k in robot.brain.data)) robot.brain.data[k] = v
      }
      robot.logger.info(`s3-brain: loaded from s3://${bucket}/${key}`)
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        robot.logger.info(`s3-brain: no brain at s3://${bucket}/${key}, starting fresh.`)
      } else {
        robot.logger.error(`s3-brain: load failed: ${err}`)
      }
    }
  }

  robot.brain.on('loaded', () => loadFromS3())

  robot.brain.on('save', () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(saveToS3, SAVE_INTERVAL_MS)
  })

  robot.brain.on('close', () => {
    clearTimeout(saveTimer)
    saveToS3()
  })
}
