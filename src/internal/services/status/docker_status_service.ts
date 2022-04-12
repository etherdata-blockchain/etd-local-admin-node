import fs from "fs";
import Docker from "dockerode";
import Logger from "@etherdata-blockchain/logger";
import { interfaces } from "@etherdata-blockchain/common";
import { GeneralService } from "../general_service";
import { RegisteredService } from "../../enums/names";

type DockerStatusResult = interfaces.db.DockerDataInterface;

export class DockerStatusService extends GeneralService<DockerStatusResult> {
  name: RegisteredService = RegisteredService.dockerStatusService;

  dockerClient?: Docker;

  async handle() {
    try {
      const images = await this.dockerClient?.listImages();
      const containers =
        (await this.dockerClient?.listContainers()) as interfaces.db.ContainerInfoWithLog[];

      // get list of logs
      const promises = containers.map<
        Promise<interfaces.db.ContainerInfoWithLog>
      >(async (c) => {
        const container = this.dockerClient?.getContainer(c.Id);
        const logs = (await container?.logs({
          tail: 100,
          stderr: true,
          stdout: true,
        })) as unknown as Buffer;
        return {
          ...c,
          logs: logs.toString(),
        };
      });

      const promiseResults = await Promise.allSettled(promises);
      promiseResults.forEach((p, i) => {
        if (p.status === "fulfilled") {
          containers[i] = p.value;
        } else {
          containers[i].logs = `${p.reason}`;
        }
      });

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
