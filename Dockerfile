FROM node:16
WORKDIR /app/etdstats_node
COPY . .
RUN yarn
RUN yarn build
CMD ["node", "dist/app.js"]