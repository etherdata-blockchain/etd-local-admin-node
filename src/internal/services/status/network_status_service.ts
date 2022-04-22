import fs from "fs";
import Docker from "dockerode";
import Logger from "@etherdata-blockchain/logger";
import { interfaces } from "@etherdata-blockchain/common";
import { getLocalIpAddress } from "@etherdata-blockchain/ip";
import { GeneralService } from "../general_service";
import { RegisteredService } from "../../enums/names";

type DockerStatusResult = interfaces.db.DockerDataInterface;

export class NetworkStatusService extends GeneralService<DockerStatusResult> {
  name: RegisteredService = RegisteredService.networkStatusService;

  dockerClient?: Docker;

  async handle(): Promise<interfaces.db.NetworkInfo> {
    const ips = getLocalIpAddress();
    return {
      localIpAddress: ips.eth0[0],
    };
  }

  async start(): Promise<any> {
    const dockerPath = "/var/run/docker.sock";

    if (fs.existsSync(dockerPath)) {
      this.dockerClient = new Docker({ socketPath: dockerPath });
    } else {
      Logger.error("Docker is not found on this system");
    }
  }
}
