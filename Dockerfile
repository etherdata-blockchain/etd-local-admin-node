FROM node:16-alpine as builder
WORKDIR /app/
COPY . .
RUN apk add --no-cache python3 py3-pip
RUN apk add --no-cache curl \
    && curl -sL https://unpkg.com/@pnpm/self-installer | node
RUN apk update && apk add make g++ && rm -rf /var/cache/apk/*
RUN pnpm install --production=true && pnpm build

FROM node:16-alpine

WORKDIR /app/
# copy from build image
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/index.js"]
