import Docker from "dockerode";
import fs from "fs";
import Logger from "../../../logger";

interface DockerValue {
  method: "logs" | "start" | "stop" | "remove" | "restart" | "exec";
  value: any;
}

export class DockerJobService {
  docker?: Docker;

  async handleDocker({
    method,
    value,
  }: DockerValue): Promise<[string | undefined, string | undefined]> {
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
