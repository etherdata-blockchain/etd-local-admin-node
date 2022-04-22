import Logger from "@etherdata-blockchain/logger";
import { interfaces } from "@etherdata-blockchain/common";
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

      const networkInfo = await this.handler.handleJob(
        RegisteredService.networkStatusService
      );

      const data =
        await this.remoteClient.emit<interfaces.db.DeviceDBInterface>(
          Channel.nodeInfo,
          {
            // @ts-ignore
            key: this.prevKey,
            data: webThreeInfo,
            nodeName: this.config.nodeName,
            adminVersion: global.version,
            docker: { ...dockerInfo },
            networkSettings: networkInfo,
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
