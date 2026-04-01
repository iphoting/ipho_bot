FROM node:22-alpine AS builder

RUN \
  apk update && apk upgrade && \
  apk --no-cache add build-base python3 libxml2-dev libxslt-dev && \
  rm -rf /var/cache/apk/*

WORKDIR /app

COPY package.json package-lock.json .npmrc /app/

RUN \
  npm ci && \
  npm cache clean --force

FROM node:22-alpine

RUN apk --no-cache add libxml2 libxslt

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

USER node

CMD ["npm", "start"]
