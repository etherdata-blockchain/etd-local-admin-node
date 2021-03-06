# ETDAdmin Node

[![codecov](https://codecov.io/gh/etherdata-blockchain/etd-local-admin-node/branch/main/graph/badge.svg?token=LFQZNAJM31)](https://codecov.io/gh/etherdata-blockchain/etd-local-admin-node)

[![Build Docker Image](https://github.com/etherdata-blockchain/etd-local-admin-node/actions/workflows/build-stable-image.yml/badge.svg)](https://github.com/etherdata-blockchain/etd-local-admin-node/actions/workflows/build-stable-image.yml)

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/6e6e3147a2ac48209a6bfcdd7066c7d1)](https://www.codacy.com/gh/etherdata-blockchain/etd-local-admin-node/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=etherdata-blockchain/etd-local-admin-node&amp;utm_campaign=Badge_Grade)

## Run

1. Install dependencies

```
yarn install
```

2. Build
```
yarn build
```

3. Start

```
node dist/app.js
```

## Available environments

rpc=
wsRpc=
db=
etd_node_id=
etd_node_name=
NODE_ENV=development

## Development

This project was split into following design pattern.

1. Handler - When remote sends any command or any schedule jobs triggered, handler will be called.
2. Service - When handler received jobs, it will be sent to the corresponding service to handle.
3. Remote client - Handle every connection between client and server

In general, services are contained by handler, and handler will decide how to use its services.
