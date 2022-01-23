import Logger from "@etherdata-blockchain/logger";
import { enums } from "@etherdata-blockchain/common";
import { BasePlugin, RegisteredPlugin } from "../basePlugin";
import { DockerJobService } from "../../services/job/docker_job_service";
import { Web3JobService } from "../../services/job/web3_job_service";
import { Channel } from "./admin-client";

interface Task {
  type: string;
  value: any;
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

  dockerJobService: DockerJobService;

  web3JobService: Web3JobService;

  constructor() {
    super();

    this.dockerJobService = new DockerJobService();
    this.web3JobService = new Web3JobService();

    this.periodicTasks = [
      {
        name: "Get pending job",
        interval: 10,
        job: this.requestJob.bind(this),
      },
    ];
  }

  async startPlugin(): Promise<void> {
    await super.startPlugin();
    await this.startJobSystemConnection();
    await this.dockerJobService.startDockerConnection();
  }

  async requestJob() {
    const result = await this.remoteAdminClient.emit(
      Channel.requestJob,
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
        case enums.JobTaskType.Web3:
          jobResult = await this.web3JobService.handle(job.task.value);
          break;

        case enums.JobTaskType.Docker:
          jobResult = await this.dockerJobService.handle(job.task.value);
          break;
        case enums.JobTaskType.UpdateTemplate:
          break;
        default:
          Logger.error(`${job.task.type} is not supported`);
      }

      const data: JobResult = {
        // eslint-disable-next-line no-underscore-dangle
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
        Channel.submitResult,
        data,
        this.config.nodeId
      );
    }
  }

  private async startJobSystemConnection() {
    await this.tryConnect(
      async () => {
        await this.remoteAdminClient.emit(Channel.health, "", "");
        return true;
      },
      async () => {
        Logger.error(`Cannot connect to remote admin server`);
      }
    );
    Logger.info("Connected to Admin server");
  }
}
