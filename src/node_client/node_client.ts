import { URL } from "url";
import Web3 from "web3";
import { TransactionSummary, Web3DataInfo } from "./web3DataInfo";
import { Admin } from "web3-eth-admin";
import { Socket }                                           from "socket.io-client";
import { BlockTransactionString, BlockHeader, Transaction } from "web3-eth";
import Logger                                               from "../logger";
import moment                                               from "moment";
import { Namespace, Server }                                from "socket.io";
import { Block }                                            from "web3-eth";
import { SystemInfo }                                       from "../systemInfo/systemInfo";
import osu                                                  from "os-utils";
import os                                                   from "os";
import { io }                                               from "socket.io-client"
import { Web3Helper }                                       from "../utils/Web3Utils";
import {Config}                                             from "../config";

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
  remoteAdminClient?: Socket
  config: Config

  constructor({}: NamedParam) {
    this.reconnectCount = 0;
    this.reconnectSleepTime = 10000;
    this.webSocketSendPeriod = 5000;
    this.systemInfoPeriod = 5000;
    this.config = Config.fromEnvironment()

    Logger.info("Start server");
  }

  /**
   * Start node server. This will also start web3 connection.
   * If web3 is not ready, this will try until is connected
   */
  async startServer() {
    // Check worker's connection
    await this.startWeb3Connection( );
    // If it is in development environment, then allow all user to access.
    let origin = process.env.NODE_ENV !== "development" ? "admin" : "*";
    Logger.warning("Cors origin is set to " + origin);
    // Enable cors for development
    let server = new Server({ cors: { origin: origin } });
    server.listen(5432);

    this.startSystemInfoServer(server);
    await this.startBlockchainInfoServer(server);
    await this.startRemoteAdminConnection()

    server.on("connection", (socket) => {
      Logger.info(`Client: ${socket.id} connect`);
    });
  }

  private startSystemInfoServer(server: Server) {
    let systemInfo = server.of("systemInfo");
    systemInfo.on("connection", (client) => {
      Logger.warning(`${client.id} has connected`);
    });

    setInterval(async () => {
      Logger.info("Update system info");
      let data = await this.prepareSystemInfo();
      for (let d of data) {
        try {
         // Update data
        } catch (err) {
          Logger.error(err);
        }
      }
      systemInfo.emit("system-info", data);
    }, this.systemInfoPeriod);
  }

  private async startBlockchainInfoServer(server: Server) {
    let blockchainInfo = server.of("blockchain");
    blockchainInfo.on("connection", (client) => {
      Logger.warning(`${client.id} has connected`);
    });
    await this.startWeb3WebSocketConnection(blockchainInfo);
  }

  private async startRemoteAdminConnection(){
    // Connect to remote
    this.remoteAdminClient = io(this.config.remoteAdminWebsocket, {auth: {token: this.config.remoteAdminPassword}})
    this.remoteAdminClient.on("connect", async ()=>{
      Logger.info("Connected to remote server")
      let latestBlock = await this.web3.eth.getBlockNumber()
    })

    this.remoteAdminClient.on("disconnect", ()=>{
      Logger.info("Disconnected from remote server")
    })


    this.remoteAdminClient.on("connect_error", async()=>{
      await this.wait(10000)
      this.remoteAdminClient.connect()
      Logger.error("Cannot connect to the server. Will reconnect")
    })
  }

  /**
   * Check connection between node and geth
   * @private
   */
  private async startWeb3Connection(): Promise<void> {
    let isConnected = false;
    while (!isConnected) {
      let web3 = new Web3(this.config.rpc);
      let admin = new Admin(this.config.rpc);

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
      new Web3.providers.WebsocketProvider(this.config.wsRpc, {
        reconnect: { auto: true, delay: this.reconnectSleepTime },
      })
    );

    this.web3WebSocket?.eth.subscribe(
      "newBlockHeaders",
      async (err, blockHeader) => {
        if (err) {
          Logger.error(err);
        } else {
          let data = await this.prepareNodeInfo(blockHeader, blockHeader.number)
          this.remoteAdminClient.emit("node-info", data)

          let coinbase = await this.web3.eth.getCoinbase();
          // if (blockHeader.miner.toLowerCase() === coinbase.toLowerCase()) {
          //   let block = await this.prepareNodeInfo(blockHeader, blockHeader.number);
          //   let reward = await Web3Helper.calculateReward(block);
          //   let rewardData = {
          //     number: block.number,
          //     time: block.timestamp,
          //     reward: reward,
          //   };
          //
          //
          //   socket.emit("block-update", block);
          //   socket.emit("reward-update", rewardData);
          //
          //   Logger.info("Mined block");
          // }
        }
      }
    );

    this.web3WebSocket?.eth.subscribe(
      "pendingTransactions",
      async (error, transaction) => {
        let data = await this.prepareTransaction(transaction);
        let coinbase = await this.web3.eth.getCoinbase();
        if (
          data.from.toLowerCase() === coinbase.toLowerCase() ||
          data.to.toLowerCase() === coinbase.toLowerCase()
        ) {

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


  /**
   * Prepare Node Info
   * @private
   */
  private async prepareNodeInfo(
      latestBlock: BlockHeader,
      blockNumber: number
  ): Promise<Web3DataInfo | undefined> {
    if (this.web3 && this.web3Admin) {
      let coinbase: string | undefined = undefined;
      let balance: string | undefined = undefined;

      try {
        let sampleSize = 50;
        let [
          prevBlock,
          prevSampleBlock,
          version,
          peerCount,
          isMining,
          isSyncing,
          hashRate,
        ] = await Promise.all([
          this.web3.eth.getBlock(blockNumber - 1),
          this.web3.eth.getBlock(blockNumber - sampleSize),
          this.web3.eth.getNodeInfo(),
          this.web3.eth.net.getPeerCount(),
          this.web3.eth.isMining(),
          this.web3.eth.isSyncing(),
          this.web3.eth.getHashrate(),
        ]);

        let blockTime =
            (latestBlock.timestamp as number) - (prevBlock.timestamp as number);
        let avgBlockTime =
            ((latestBlock.timestamp as number) -
                (prevSampleBlock.timestamp as number)) /
            sampleSize;

        try {
          coinbase = await this.web3.eth.getCoinbase();
          balance = await this.web3.eth.getBalance(coinbase);
        } catch (err) {}

        return {
          timestamp: latestBlock.timestamp,
          //@ts-ignore
          difficulty: latestBlock.difficulty.toString(),
          gasLimit: latestBlock.gasLimit,
          gasUsed: latestBlock.gasUsed,
          hash: latestBlock.hash,
          miner: latestBlock.hash,
          nonce: latestBlock.nonce,
          balance: balance,
          blockNumber,
          systemInfo: {
            name: this.config.nodeName,
            peerCount: peerCount,
            isMining: isMining,
            isSyncing: isSyncing as boolean,
            coinbase: coinbase,
            nodeVersion: version,
            hashRate: hashRate,
            nodeId: this.config.nodeId,
          },
          blockTime: blockTime,
          avgBlockTime: avgBlockTime,
          peers: [],
        };
      } catch (err) {
        Logger.error("Cannot connect to the RPC Endpoint: " + err);
      }
    }
    return undefined;
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
