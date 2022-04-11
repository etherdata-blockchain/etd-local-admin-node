import Logger from "@etherdata-blockchain/logger";
import { BaseHandler } from "../base_handler";
import { Web3StatusService } from "../../services/status/web3_status_service";
import { DockerStatusService } from "../../services/status/docker_status_service";
import { Channel } from "../../enums/channels";
import { RegisteredHandler, RegisteredService } from "../../enums/names";
import { JobResult } from "../../services/general_service";
import { NodeInfoService } from "../../services/status/node_info_service";

export type StatusJob =
  | RegisteredService.dockerStatusService
  | RegisteredService.web3StatusService;

export class StatusHandler extends BaseHandler {
  protected handlerName: RegisteredHandler = RegisteredHandler.statusHandler;

  constructor() {
    super();

    this.addService(new Web3StatusService())
      .addService(new DockerStatusService())
      .addService(new NodeInfoService());
  }

  async handleJob(serviceName: StatusJob): Promise<JobResult | undefined> {
    try {
      await super.handleJob(serviceName);
      const handler = this.findServiceByName(serviceName);
      return await handler.handle();
    } catch (err) {
      Logger.error(`Status Handler: ${err}`);
      return undefined;
    }
  }

  override async startHandler(): Promise<void> {
    try {
      await this.remoteClient.emit(
        Channel.nodeInfo,
        {
          nodeName: this.config.nodeName,
        },
        this.config.nodeId
      );
    } catch (e) {
      Logger.error(e);
    }
    await super.startHandler();
  }
}
