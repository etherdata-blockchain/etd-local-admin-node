import fs from "fs";
import Docker, { ContainerInfo, ImageInfo } from "dockerode";
import Logger from "../../../logger";

export class DockerStatusService {
  dockerClient?: Docker;

  async connect() {
    const dockerPath = "/var/run/docker.sock";

    if (fs.existsSync(dockerPath)) {
      this.dockerClient = new Docker({ socketPath: dockerPath });
    } else {
      Logger.error("Docker is not found on this system");
    }
  }

  async prepareDockerInfo(): Promise<{
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
}
