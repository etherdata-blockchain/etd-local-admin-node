import Logger from "@etherdata-blockchain/logger";
import { interfaces } from "@etherdata-blockchain/common";
import { BaseHandler, RegisteredPlugin } from "../base_handler";
import { DockerJobService } from "../../services/job/docker_job_service";
import { Web3JobService } from "../../services/job/web3_job_service";
import { DefaultTimeSettings } from "../../../config";
import { Channel } from "../../utils/command/enums";
import { UpdateTemplateJobService } from "../../services/job/update_template_job_service";
import { GeneralService, JobResult } from "../../services/general_service";

export class JobHandler extends BaseHandler {
  prevKey: string | undefined;

  protected pluginName: RegisteredPlugin = RegisteredPlugin.jobPlugin;

  services: GeneralService<any>[];

  constructor() {
    super();
    this.services = [
      new DockerJobService(),
      new Web3JobService(),
      new UpdateTemplateJobService(),
    ];

    this.periodicTasks = [
      {
        name: "Get pending job",
        interval: DefaultTimeSettings.jobInterval,
        job: this.requestJob.bind(this),
      },
    ];
  }

  async startPlugin(): Promise<void> {
    await super.startPlugin();
    await this.startJobSystemConnection();
    for (const service of this.services) {
      await service.start();
    }
  }

  async requestJob(): Promise<interfaces.db.JobResultDBInterface | undefined> {
    const result = await this.remoteAdminClient.emit(
      Channel.requestJob,
      { nodeName: this.config.nodeName, key: this.prevKey },
      this.config.nodeId
    );

    if (result) {
      this.prevKey = result.key;
    }

    const job: interfaces.db.PendingJobDBInterface<any> | undefined =
      result?.job;
    let jobResult: JobResult;

    if (job && job.task) {
      Logger.info(`Getting job: ${job.task.type}`);
      jobResult = await this.handleJob(job);

      const data: interfaces.db.JobResultDBInterface = {
        // eslint-disable-next-line no-underscore-dangle
        jobId: (job as any)._id,
        commandType: job.task.type,
        command: job.task.value,
        deviceID: this.config.nodeId,
        from: job.from,
        result: jobResult.result ?? jobResult.error,
        success: jobResult.error === undefined,
        time: new Date(),
        // @ts-ignore
        key: this.prevKey,
      };

      await this.remoteAdminClient.emit(
        Channel.submitResult,
        data,
        this.config.nodeId
      );

      return data;
    }
    return undefined;
  }

  /**
   * Handle job based on different job task type
   * @param job
   * @private
   */
  private async handleJob(job: interfaces.db.PendingJobDBInterface<any>) {
    let jobResult: JobResult;
    for (const service of this.services) {
      if (service.canHandle(job.task.type)) {
        jobResult = await service.handle(job.task.value);
        break;
      }
    }
    return jobResult;
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
