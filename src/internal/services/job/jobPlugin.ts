import axios from "axios";
import Docker from "dockerode";
import * as fs from "fs";
import { BasePlugin, RegisteredPlugin } from "../basePlugin";
import Logger from "../../../logger";
import { CoinbaseHandler } from "../../handlers/command";

interface Web3Value {
  method: string;
  params: string[];
}

interface DockerValue {
  method: "logs" | "start" | "stop" | "remove" | "restart" | "exec";
  value: any;
}

interface Task {
  type: string;
  value: Web3Value | DockerValue;
}

export interface PendingJob {
  _id: any;
  targetDeviceId: string;
  /**
   * From client id.
   */
  from: string;
  time: Date;
  task: Task;
}

interface JobResult {
  key: string | undefined;
  jobId: string;
  time: Date;
  deviceID: string;
  commandType: string;
  /**
   * From which client. This will be the unique id
   */
  from: string;
  command: any;
  result: any;
  success: boolean;
}

export class JobPlugin extends BasePlugin {
  prevKey: string | undefined;

  protected pluginName: RegisteredPlugin = "jobPlugin";

  private dockerClient?: Docker | undefined;

  constructor() {
    super();
    this.periodicTasks = [
      {
        name: "Get pending job",
        interval: 10,
        job: this.requestJob.bind(this),
      },
    ];
  }

  override async startPlugin(): Promise<void> {
    await super.startPlugin();
    await this.startJobSystemConnection();
    await this.startDockerConnection();
  }

  async requestJob() {
    const result = await this.remoteAdminClient.emit(
      "request-job",
      { nodeName: this.config.nodeName, key: this.prevKey },
      this.config.nodeId
    );

    if (result) {
      this.prevKey = result.key;
    }

    const job: PendingJob | undefined = result?.job;
    let jobResult: [string | undefined, string | undefined] = [
      undefined,
      undefined,
    ];

    if (job && job.task) {
      Logger.info(`Getting job: ${job.task.type}`);
      switch (job.task.type) {
        case "web3":
          jobResult = await this.handleWeb3Job(job.task.value as Web3Value);
          break;

        case "docker":
          jobResult = await this.handleDocker(job.task.value as DockerValue);
          break;
        default:
          Logger.error(`${job.task.type} is not supported`);
      }

      const data: JobResult = {
        jobId: job._id,
        commandType: job.task.type,
        command: job.task.value,
        deviceID: this.config.nodeId,
        from: job.from,
        result: jobResult[0] ?? jobResult[1],
        success: jobResult[1] === undefined,
        time: new Date(),
        key: this.prevKey,
      };

      await this.remoteAdminClient.emit(
        "submit-result",
        data,
        this.config.nodeId
      );
    }
  }

  private async startDockerConnection(): Promise<void> {
    const dockerPath = "/var/run/docker.sock";
    if (fs.existsSync(dockerPath)) {
      this.dockerClient = new Docker({ socketPath: dockerPath });
    } else {
      Logger.error("Docker is not found on your system");
    }
  }

  private async startJobSystemConnection() {
    await this.tryConnect(
      async () => {
        await this.remoteAdminClient.emit("health", "", "");
        return true;
      },
      async () => {
        Logger.error(`Cannot connect to remote admin server`);
      }
    );
    Logger.info("Connected to Admin server");
  }

  private async handleDocker({
    method,
    value,
  }: DockerValue): Promise<[string | undefined, string | undefined]> {
    switch (method) {
      case "logs":
        const container = this.dockerClient?.getContainer(value);
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

  /**
   * Will return a array includes result or error
   * @param method
   * @param params
   * @private
   */
  private async handleWeb3Job({
    method,
    params,
  }: Web3Value): Promise<[string | undefined, string | undefined]> {
    const result = await axios.post(this.config.rpc, {
      method,
      params,
      jsonrpc: "2.0",
      id: 1,
    });

    if (!result.data.error) {
      const coinbaseHandler = new CoinbaseHandler();
      if (coinbaseHandler.canHandle({ command: method })) {
        await coinbaseHandler.handle({
          command: method,
          data: { newCoinbase: params[0] },
        });
      }

      return [result.data.result, undefined];
    }

    return [undefined, result.data.error.message];
  }
}
