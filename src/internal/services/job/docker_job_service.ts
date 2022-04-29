import Docker from "dockerode";
import fs from "fs";
import Logger from "@etherdata-blockchain/logger";
import { enums } from "@etherdata-blockchain/common";
import { GeneralService, JobResult } from "../general_service";
import { JobName, RegisteredService } from "../../enums/names";

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

    let result: any | undefined;

    switch (method) {
      case "logs":
        result = await this.handleLogs(value);
        break;
      case "removeVolume":
        result = await this.handleRemoveVolume(value);
        break;
      case "removeContainer":
        result = await this.handleRemoveContainer(value);
        break;
      case "removeImage":
        result = await this.handleRemoveImage(value);
        break;
      case "stopContainer":
        result = await this.handleStopContainer(value);
        break;
      default:
        result = { error: "Command is not supported", result: undefined };
        break;
    }
    // determine whether error occurs. If not, then request handler to send a new status to server
    if (result.error === undefined) {
      await this.handler?.handleJob(JobName.updateStatus);
    }
    return result;
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
