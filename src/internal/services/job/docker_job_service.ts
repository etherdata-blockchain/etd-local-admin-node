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
        return this.handleLogs(value);
      case "removeVolume":
        return this.handleRemoveVolume(value);
      case "removeContainer":
        return this.handleRemoveContainer(value);
      case "removeImage":
        return this.handleRemoveImage(value);
      case "stopContainer":
        return this.handleStopContainer(value);
      default:
        return { error: "Command is not supported", result: undefined };
    }
  }

  async handleStopContainer(value: string) {
    const container = this.docker.getContainer(value);
    const result = await container.stop();
    return { result: `${result}` };
  }

  async handleRemoveImage(value: string) {
    const image = this.docker.getImage(value);
    const result = await image.remove();
    return { result: `${result}` };
  }

  async handleRemoveContainer(value: string) {
    const container = this.docker.getContainer(value);
    await container.stop();
    const result = await container.remove();
    return { result: `${result}` };
  }

  async handleRemoveVolume(value: string) {
    const volume = this.docker.getVolume(value);
    const result = await volume.remove();
    return { result: `${result}` };
  }

  async handleLogs(value: string) {
    const container = this.docker?.getContainer(value);
    const logs = (await container?.logs({
      tail: 100,
      stderr: true,
      stdout: true,
    })) as unknown as Buffer;
    return { result: logs?.toString(), error: undefined };
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
