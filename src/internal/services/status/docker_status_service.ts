import fs from "fs";
import Docker, { ContainerInfo, ImageInfo } from "dockerode";
import Logger from "@etherdata-blockchain/logger";
import { GeneralService, JobResult } from "../general_service";
import { RegisteredService } from "../../enums/names";

interface DockerStatusResult extends JobResult {
  images: ImageInfo[];
  containers: ContainerInfo[];
}

export class DockerStatusService extends GeneralService<any> {
  name: RegisteredService = RegisteredService.dockerStatusService;

  dockerClient?: Docker;

  async handle(): Promise<DockerStatusResult> {
    try {
      const images = await this.dockerClient?.listImages();
      const containers = await this.dockerClient?.listContainers();

      return {
        images: images ?? [],
        containers: containers ?? [],
      };
    } catch (e) {
      return undefined;
    }
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
