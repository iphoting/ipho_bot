FROM node:10-alpine

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

COPY . .

RUN \
  apk --no-cache del build-base

CMD ["npm", "start"]
