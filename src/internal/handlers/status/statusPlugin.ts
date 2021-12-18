import Web3 from "web3";
import { Admin } from "web3-eth-admin";
import Docker, { ContainerInfo, ImageInfo } from "dockerode";
import * as fs from "fs";
import Logger from "../../../logger";
import { Web3DataInfo } from "../../interfaces/web3DataInfo";
import { BasePlugin, RegisteredPlugin } from "../basePlugin";

export class StatusPlugin extends BasePlugin {
  web3: Web3 | undefined;

  web3Admin: Admin | undefined;

  // In MS
  prevKey: string | undefined;

  protected pluginName: RegisteredPlugin = "statusPlugin";

  private dockerClient?: Docker;

  constructor() {
    super();
    this.periodicTasks = [
      {
        name: "latest-node-info",
        interval: 15,
        job: this.sendNodeInfo.bind(this),
      },
    ];
  }

  override async startPlugin(): Promise<void> {
    await super.startPlugin();
    try {
      await this.startWeb3Connection();
      await this.startDockerConnection();
      await this.remoteAdminClient.emit(
        "node-info",
        { nodeName: this.config.nodeName, key: this.prevKey },
        this.config.nodeId
      );
    } catch (e) {
      Logger.error(e);
    }
  }

  async sendNodeInfo(): Promise<void> {
    const latestBlockNumber = await this.web3?.eth.getBlockNumber();
    const webThreeInfo = await this.prepareWebThreeInfo(latestBlockNumber);
    const dockerInfo = await this.prepareDockerInfo();

    const data = await this.remoteAdminClient.emit(
      "node-info",
      {
        key: this.prevKey,
        data: webThreeInfo,
        nodeName: this.config.nodeName,
        adminVersion: global.version,
        docker: { ...dockerInfo },
      },
      this.config.nodeId
    );

    if (data) {
      this.prevKey = data.key;
    }
  }

  /**
   * Prepare Node Info
   * @private
   */
  private async prepareWebThreeInfo(
    blockNumber: number
  ): Promise<Web3DataInfo | undefined> {
    if (this.web3 && this.web3Admin) {
      let coinbase: string | undefined;
      let balance: string | undefined;

      try {
        const sampleSize = 50;
        const [
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

        const blockTime =
          (currentBlock.timestamp as number) - (prevBlock.timestamp as number);
        const avgBlockTime =
          ((currentBlock.timestamp as number) -
            (prevSampleBlock.timestamp as number)) /
          sampleSize;

        try {
          coinbase = await this.web3.eth.getCoinbase();
          balance = await this.web3.eth.getBalance(coinbase);
        } catch (err) {}

        return {
          ...currentBlock,
          balance,
          systemInfo: {
            name: this.config.nodeName,
            peerCount,
            isMining,
            isSyncing: isSyncing as boolean,
            coinbase,
            nodeVersion: version,
            hashRate,
            nodeId: this.config.nodeId,
          },
          blockTime,
          avgBlockTime,
          peers: [],
        };
      } catch (err) {
        Logger.error(`Cannot connect to the RPC Endpoint: ${err}`);
      }
    }
    return undefined;
  }

  private async startDockerConnection(): Promise<void> {
    const dockerPath = "/var/run/docker.sock";

    if (fs.existsSync(dockerPath)) {
      this.dockerClient = new Docker({ socketPath: dockerPath });
    } else {
      Logger.error("Docker is not found on this system");
    }
  }

  private async prepareDockerInfo(): Promise<{
    images: ImageInfo[];
    containers: ContainerInfo[];
  }> {
    const images = await this.dockerClient?.listImages();
    const containers = await this.dockerClient?.listContainers();

    return {
      images: images ?? [],
      containers: containers ?? [],
    };
  }

  /**
   * Check connection between node and geth
   * @private
   */
  private async startWeb3Connection(): Promise<void> {
    await this.tryConnect(
      async () => {
        const web3 = new Web3(this.config.rpc);
        const admin = new Admin(this.config.rpc);

        this.web3 = web3;
        this.web3Admin = admin;

        return true;
      },
      async (err) => {
        Logger.error(
          `Cannot connect to geth network. Sleep 3 seconds! ${err.toString()}`
        );
        await this.wait(3000);
      }
    );

    Logger.info(`Latest Block: ${await this.web3.eth.getBlockNumber()}`);
  }
}
