import Docker from "dockerode";
import fs from "fs";
import Logger from "@etherdata-blockchain/logger";
import { enums } from "@etherdata-blockchain/common";
import { GeneralService } from "../general_service";

export class DockerJobService extends GeneralService<enums.DockerValueType> {
  docker?: Docker;

  async handle({
    method,
    value,
  }: enums.DockerValueType): Promise<[string | undefined, string | undefined]> {
    switch (method) {
      case "logs":
        const container = this.docker?.getContainer(value);
        const logs = (await container?.logs({
          tail: 100,
          stderr: true,
          stdout: true,
        })) as unknown as Buffer;
        return [logs?.toString(), undefined];
      default:
        return [undefined, "Command is not supported"];
    }
  }

  async startDockerConnection(): Promise<void> {
    const dockerPath = "/var/run/docker.sock";
    if (fs.existsSync(dockerPath)) {
      this.docker = new Docker({ socketPath: dockerPath });
    } else {
      Logger.error("Docker is not found on your system");
    }
  }
}
