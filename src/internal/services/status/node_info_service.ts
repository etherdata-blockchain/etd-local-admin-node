import Logger from "@etherdata-blockchain/logger";
import { GeneralService } from "../general_service";
import { RegisteredService } from "../../enums/names";
import { Channel } from "../../enums/channels";

export class NodeInfoService extends GeneralService<any> {
  name: RegisteredService = RegisteredService.nodeInfoService;

  prevKey: string | undefined;

  isPeriodicTask = true;

  async handle(): Promise<any> {
    try {
      Logger.info("Sending node info");
      const webThreeInfo = await this.handler.handleJob(
        RegisteredService.web3StatusService
      );

      const dockerInfo = await this.handler.handleJob(
        RegisteredService.dockerStatusService
      );

      const data = await this.remoteClient.emit(
        Channel.nodeInfo,
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
    } catch (e) {
      Logger.error(e);
    }
  }

  async start(): Promise<any> {
    return Promise.resolve();
  }
}
