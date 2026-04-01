FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json .npmrc /app/

RUN \
  npm ci && \
  npm cache clean --force

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

USER node

CMD ["npm", "start"]
