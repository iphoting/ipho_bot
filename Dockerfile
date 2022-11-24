FROM node:10-alpine AS builder

RUN \
  apk update && apk upgrade && \
  apk --no-cache add build-base python3 libxml2-dev libxslt-dev && \
  rm -rf /var/cache/apk/*

WORKDIR /app

COPY package.json package-lock.json Procfile /app/

RUN \
  npm install && \
  npm cache clean --force && \
  chown -R 65534:65534 ~/.npm

FROM node:10-alpine

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

CMD ["npm", "start"]
