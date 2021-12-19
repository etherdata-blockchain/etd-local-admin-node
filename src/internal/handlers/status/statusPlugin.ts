import Logger from "../../../logger";
import { BasePlugin, RegisteredPlugin } from "../basePlugin";
import { Web3StatusService } from "../../services/status/web3_status_service";
import { DockerStatusService } from "../../services/status/docker_status_service";

export class StatusPlugin extends BasePlugin {
  protected pluginName: RegisteredPlugin = "statusPlugin";

  web3StatusService: Web3StatusService;

  dockerStatusService: DockerStatusService;

  constructor() {
    super();
    this.web3StatusService = new Web3StatusService();
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
        { nodeName: this.config.nodeName, key: this.web3StatusService.prevKey },
        this.config.nodeId
      );
    } catch (e) {
      Logger.error(e);
    }
  }

  async sendNodeInfo(): Promise<void> {
    const latestBlockNumber =
      await this.web3StatusService.getLatestBlockNumber();
    const webThreeInfo = await this.web3StatusService.prepareWebThreeInfo(
      latestBlockNumber
    );
    const dockerInfo = await this.dockerStatusService.prepareDockerInfo();

    const data = await this.remoteAdminClient.emit(
      "node-info",
      {
        key: this.web3StatusService.prevKey,
        data: webThreeInfo,
        nodeName: this.config.nodeName,
        adminVersion: global.version,
        docker: { ...dockerInfo },
      },
      this.config.nodeId
    );

    if (data) {
      this.web3StatusService.prevKey = data.key;
    }
  }

  private async startDockerConnection(): Promise<void> {
    return this.dockerStatusService.connect();
  }

  /**
   * Check connection between node and geth
   * @private
   */
  private async startWeb3Connection(): Promise<void> {
    await this.tryConnect(
      async () => this.web3StatusService.connect(),
      async (err) => {
        Logger.error(
          `Cannot connect to geth network. Sleep 3 seconds! ${err.toString()}`
        );
        await this.wait(3000);
      }
    );

    Logger.info(
      `Latest Block: ${await this.web3StatusService.getLatestBlockNumber()}`
    );
  }
}
