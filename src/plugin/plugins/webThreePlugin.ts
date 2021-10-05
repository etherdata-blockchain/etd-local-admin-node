import { BasePlugin, RegisteredPlugin } from "../basePlugin";
import Web3 from "web3";
import { Admin } from "web3-eth-admin";
import Logger from "../../logger";
import { Web3DataInfo } from "../../node_client/web3DataInfo";

export class WebThreePlugin extends BasePlugin {
  protected pluginName: RegisteredPlugin = "webThree";
  web3: Web3 | undefined;
  web3Admin: Admin | undefined;
  reconnectCount: number;
  // In MS
  reconnectSleepTime: number;

  constructor() {
    super();
    this.periodicTasks = [
      {
        name: "latest-node-info",
        interval: 10,
        job: this.sendNodeInfo.bind(this),
      },
    ];
  }

  override async startPlugin(): Promise<void> {
    await super.startPlugin();
    try {
      await this.startWeb3Connection();
      await this.remoteAdminClient.emit(
        "node-info",
        { nodeName: this.config.nodeName },
        this.config.nodeId
      );
    } catch (e) {
      Logger.error(e);
    }
  }

  async sendNodeInfo(): Promise<void> {
    let latestBlockNumber = await this.web3.eth.getBlockNumber();
    let info = await this.prepareNodeInfo(latestBlockNumber);
    await this.remoteAdminClient.emit(
      "node-info",
      {
        data: info,
        nodeName: this.config.nodeName,
        adminVersion: global.version,
      },
      this.config.nodeId
    );
  }

  /**
   * Prepare Node Info
   * @private
   */
  private async prepareNodeInfo(
    blockNumber: number
  ): Promise<Web3DataInfo | undefined> {
    if (this.web3 && this.web3Admin) {
      let coinbase: string | undefined = undefined;
      let balance: string | undefined = undefined;

      try {
        let sampleSize = 50;
        let [
          currentBlock,
          prevBlock,
          prevSampleBlock,
          version,
          peerCount,
          isMining,
          isSyncing,
          hashRate,
        ] = await Promise.all([
          this.web3.eth.getBlock(blockNumber),
          this.web3.eth.getBlock(blockNumber - 1),
          this.web3.eth.getBlock(blockNumber - sampleSize),
          this.web3.eth.getNodeInfo(),
          this.web3.eth.net.getPeerCount(),
          this.web3.eth.isMining(),
          this.web3.eth.isSyncing(),
          this.web3.eth.getHashrate(),
        ]);

        let blockTime =
          (currentBlock.timestamp as number) - (prevBlock.timestamp as number);
        let avgBlockTime =
          ((currentBlock.timestamp as number) -
            (prevSampleBlock.timestamp as number)) /
          sampleSize;

        try {
          coinbase = await this.web3.eth.getCoinbase();
          balance = await this.web3.eth.getBalance(coinbase);
        } catch (err) {}

        return {
          ...currentBlock,
          balance: balance,
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

  /**
   * Check connection between node and geth
   * @private
   */
  private async startWeb3Connection(): Promise<void> {
    await this.tryConnect(
      async () => {
        let web3 = new Web3(this.config.rpc);
        let admin = new Admin(this.config.rpc);
        let isConnected = await web3.eth.net.isListening();
        this.web3 = web3;
        this.web3Admin = admin;

        return isConnected;
      },
      async () => {
        Logger.error("Cannot connect to geth network. Sleep 3 seconds!");
        await this.wait(3000);
      }
    );

    Logger.info("Latest Block: " + (await this.web3.eth.getBlockNumber()));
  }
}
