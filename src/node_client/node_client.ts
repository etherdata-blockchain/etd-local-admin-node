import { io } from "socket.io-client";
import { URL } from "url";
import Web3 from "web3";
import { TransactionSummary, Web3DataInfo } from "./web3DataInfo";
import { Admin } from "web3-eth-admin";
import { Socket } from "socket.io-client";
import { BlockTransactionString, BlockHeader, Transaction } from "web3-eth";
import Logger from "../logger";
import moment from "moment";
import { Namespace, Server } from "socket.io";
import { Block } from "web3-eth";
import { SystemInfo } from "../systemInfo/systemInfo";
import osu from "os-utils";
import os from "os";
import { MongoClient } from "mongodb";
import { Web3Helper } from "../utils/Web3Utils";

interface NamedParam {}

export class NodeClient {
  reconnectCount: number;
  // In MS
  reconnectSleepTime: number;
  web3: Web3 | undefined;
  web3Admin: Admin | undefined;
  web3WebSocket: Web3 | undefined;
  webSocketSendPeriod: number;
  systemInfoPeriod: number;
  mongodbClient: MongoClient;

  constructor({}: NamedParam) {
    this.reconnectCount = 0;
    this.reconnectSleepTime = 10000;
    this.webSocketSendPeriod = 5000;
    this.systemInfoPeriod = 5000;
    this.mongodbClient = new MongoClient(
      `mongodb://${process.env.etd_node_name}:${process.env.etd_node_id}@${process.env.db}/`
    );
    Logger.info("Start server");
  }

  /**
   * Start node server. This will also start web3 connection.
   * If web3 is not ready, this will try until is connected
   */
  async startServer() {
    // Check worker's connection
    await this.startWeb3Connection();
    await this.mongodbClient.connect();
    // If it is in development environment, then allow all user to access.
    let origin = process.env.NODE_ENV !== "development" ? "admin-ui" : "*";
    Logger.warning("Cors origin is set to " + origin);
    // Enable cors for development
    let server = new Server({ cors: { origin: origin } });
    server.listen(5432);

    this.startSystemInfoServer(server);
    await this.startBlockchainInfoServer(server);

    server.on("connection", (socket) => {
      Logger.info(`Client: ${socket.id} connect`);
    });
  }

  private startSystemInfoServer(server: Server) {
    let systemInfo = server.of("systemInfo");
    let col = this.mongodbClient
      .db("etd")
      .collection<SystemInfo>("system_info");
    setInterval(async () => {
      Logger.info("Update system info");
      let data = await this.prepareSystemInfo();
      for (let d of data) {
        try {
          await col.updateOne(
            { title: d.title },
            { $set: d },
            { upsert: true }
          );
        } catch (err) {
          Logger.error(err);
        }
      }
      systemInfo.emit("system-info", data);
    }, this.systemInfoPeriod);
  }

  private async startBlockchainInfoServer(server: Server) {
    let blockchainInfo = server.of("blockchain");
    await this.startWeb3WebSocketConnection(blockchainInfo);
  }

  /**
   * Check connection between node and geth
   * @private
   */
  private async startWeb3Connection(): Promise<void> {
    let isConnected = false;
    while (!isConnected) {
      let web3 = new Web3(process.env.rpc);
      let admin = new Admin(process.env.rpc);

      try {
        isConnected = await web3.eth.net.isListening();
        this.web3 = web3;
        this.web3Admin = admin;
        this.reconnectCount = 0;
      } catch (err) {
        isConnected = false;
        Logger.info(`Connection count: ${this.reconnectCount} Failed`);
        Logger.error(`Geth is not running, sleep ${this.reconnectSleepTime}`);
        await this.wait(this.reconnectSleepTime);
        this.reconnectCount += 1;
      }
    }
    Logger.info("Latest Block: " + (await this.web3.eth.getBlockNumber()));
  }

  /**
   * Will subscribe new block and broadcast the info
   */
  private async startWeb3WebSocketConnection(socket: Namespace) {
    this.web3WebSocket = new Web3();
    this.web3WebSocket?.setProvider(
      new Web3.providers.WebsocketProvider(process.env.wsRpc, {
        reconnect: { auto: true, delay: this.reconnectSleepTime },
      })
    );

    let coinbase = await this.web3.eth.getCoinbase();
    let rewardCol = this.mongodbClient.db("etd").collection("reward");
    let blockCol = this.mongodbClient.db("etd").collection("blocks");
    let transactionCol = this.mongodbClient
      .db("etd")
      .collection<TransactionSummary>("transactions");

    this.web3WebSocket?.eth.subscribe(
      "newBlockHeaders",
      async (err, blockHeader) => {
        if (err) {
          Logger.error(err);
        } else {
          if (blockHeader.miner.toLowerCase() === coinbase.toLowerCase()) {
            let block = await this.prepareBlock(blockHeader.number);
            let reward = await Web3Helper.calculateReward(block);
            let rewardData = {
              number: block.number,
              time: block.timestamp,
              reward: reward,
            };

            await blockCol.updateOne(
              { number: block.number },
              { $set: block },
              { upsert: true }
            );

            await rewardCol.updateOne(
              { number: block.number },
              {
                $set: rewardData,
              },
              { upsert: true }
            );

            socket.emit("block-update", block);
            socket.emit("reward-update", rewardData);

            Logger.info("Mined block");
          }
        }
      }
    );

    this.web3WebSocket?.eth.subscribe(
      "pendingTransactions",
      async (error, transaction) => {
        let data = await this.prepareTransaction(transaction);
        if (
          data.from.toLowerCase() === coinbase.toLowerCase() ||
          data.to.toLowerCase() === coinbase.toLowerCase()
        ) {
          await transactionCol.updateOne(
            { hash: data.hash },
            { $set: data },
            { upsert: true }
          );

          socket.emit("transaction-update", data);
        }
      }
    );
  }

  private wait(time: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  private async prepareTransaction(
    transactionID: string
  ): Promise<TransactionSummary | undefined> {
    if (this.web3) {
      let transaction = await this.web3.eth.getTransaction(transactionID);
      return {
        time: new Date(),
        from: transaction.from,
        to: transaction.to,
        gas: transaction.gas,
        gasPrice: transaction.gasPrice,
        hash: transaction.hash,
        value: transaction.value,
      };
    }

    return undefined;
  }

  private async prepareBlock(blockNumber: number): Promise<Block | undefined> {
    try {
      let block = await this.web3.eth.getBlock(blockNumber);
      return block;
    } catch (err) {
      Logger.error(err);
      return undefined;
    }
  }

  private async prepareSystemInfo(): Promise<SystemInfo[]> {
    let memoryFree = os.freemem();
    let sysUpTime = osu.sysUptime();
    let cpuUsage: number = await new Promise((resolve, reject) => {
      osu.cpuUsage((u) => {
        resolve(u);
      });
    });

    return [
      {
        title: "CPU",
        description: "CPU Usage",
        value: (cpuUsage * 100).toFixed(2),
        unit: "%",
      },
      {
        title: "Mem Free",
        description: "Memory Free",
        value: (memoryFree / 1024 / 1024 / 1024).toFixed(2),
        unit: "GB",
      },
      {
        title: "Up Time",
        description: "System Up Time",
        value: moment({}).seconds(sysUpTime).format("HH:mm:ss"),
        unit: "",
      },
    ];
  }
}
