import Docker from "dockerode";
import fs from "fs";
import Logger from "@etherdata-blockchain/logger";
import { enums } from "@etherdata-blockchain/common";
import { GeneralService, JobResult } from "../general_service";
import { RegisteredService } from "../../enums/names";

export class DockerJobService extends GeneralService<enums.DockerValueType> {
  name = RegisteredService.dockerJobService;

  docker?: Docker;

  targetJobTaskType = enums.JobTaskType.Docker;

  async handle({ method, value }: enums.DockerValueType): Promise<JobResult> {
    if (this.docker === undefined) {
      return {
        result: undefined,
        error: "Docker is not found on this machine",
      };
    }

    switch (method) {
      case "logs":
        const container = this.docker?.getContainer(value);
        const logs = (await container?.logs({
          tail: 100,
          stderr: true,
          stdout: true,
        })) as unknown as Buffer;
        return { result: logs?.toString(), error: undefined };
      default:
        return { error: "Command is not supported", result: undefined };
    }
  }

  async start(): Promise<void> {
    const dockerPath = "/var/run/docker.sock";
    if (fs.existsSync(dockerPath)) {
      this.docker = new Docker({ socketPath: dockerPath });
    } else {
      Logger.error("Docker is not found on your system");
    }
  }
}
