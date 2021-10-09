FROM node:16-alpine as builder
WORKDIR /app/
COPY . .
RUN apk add --no-cache python3 py3-pip
RUN apk update && apk add make g++ && rm -rf /var/cache/apk/*
RUN yarn install --production=true
RUN yarn build

FROM node:16-alpine

WORKDIR /app/

# copy from build image
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json


CMD ["node", "dist/app.js"]