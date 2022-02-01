import Logger from "@etherdata-blockchain/logger";
import { BaseHandler, RegisteredPlugin } from "../base_handler";
import { Web3StatusService } from "../../services/status/web3_status_service";
import { DockerStatusService } from "../../services/status/docker_status_service";
import { DefaultTimeSettings } from "../../../config";
import { Channel } from "../../utils/command/enums";

export class StatusHandler extends BaseHandler {
  protected pluginName: RegisteredPlugin = RegisteredPlugin.statusPlugin;

  web3StatusService: Web3StatusService;

  dockerStatusService: DockerStatusService;

  constructor() {
    super();
    this.web3StatusService = new Web3StatusService();
    this.dockerStatusService = new DockerStatusService();
    this.periodicTasks = [
      {
        name: "latest-node-info",
        interval: DefaultTimeSettings.statusInterval,
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
        Channel.nodeInfo,
        { nodeName: this.config.nodeName, key: this.web3StatusService.prevKey },
        this.config.nodeId
      );
    } catch (e) {
      Logger.error(e);
    }
  }

  async sendNodeInfo(): Promise<void> {
    try {
      Logger.info("Sending node info");
      const latestBlockNumber =
        await this.web3StatusService.getLatestBlockNumber();
      // Only check latest web three info when latest block number is defined
      const webThreeInfo =
        latestBlockNumber !== undefined
          ? await this.web3StatusService.prepareWebThreeInfo(latestBlockNumber)
          : undefined;
      const dockerInfo = await this.dockerStatusService.prepareDockerInfo();

      const data = await this.remoteAdminClient.emit(
        Channel.nodeInfo,
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
    } catch (e) {
      Logger.error(e);
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