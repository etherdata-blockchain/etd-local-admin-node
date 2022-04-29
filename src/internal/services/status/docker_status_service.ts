import fs from "fs";
import Docker, { ImageInfo, VolumeInspectInfo } from "dockerode";
import Logger from "@etherdata-blockchain/logger";
import { interfaces } from "@etherdata-blockchain/common";
import { GeneralService } from "../general_service";
import { RegisteredService } from "../../enums/names";

type DockerStatusResult = interfaces.db.DockerDataInterface;

export class DockerStatusService extends GeneralService<DockerStatusResult> {
  name: RegisteredService = RegisteredService.dockerStatusService;

  dockerClient?: Docker;

  async handle(): Promise<interfaces.db.DockerDataInterface> {
    try {
      let containers: interfaces.db.ContainerInfoWithLog[] = [];
      let images: ImageInfo[] = [];
      let volumes: VolumeInspectInfo[] = [];

      const dockerResults = await Promise.allSettled([
        this.dockerClient?.listImages(),
        this.dockerClient?.listContainers(),
        this.dockerClient?.listVolumes(),
      ]);

      if (dockerResults[0].status === "fulfilled") {
        images = dockerResults[0].value.sort((a, b) =>
          a.Id.localeCompare(b.Id)
        );
      }

      if (dockerResults[1].status === "fulfilled") {
        containers = dockerResults[1].value.sort((a, b) =>
          a.Id.localeCompare(b.Id)
        );
      }

      if (dockerResults[2].status === "fulfilled") {
        volumes = dockerResults[2].value.Volumes.sort((a, b) =>
          a.Name.localeCompare(b.Name)
        );
      }

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
        images,
        containers,
        volumes,
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
