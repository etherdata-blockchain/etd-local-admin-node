import { enums, interfaces } from "@etherdata-blockchain/common";
import Logger from "@etherdata-blockchain/logger";
import { GeneralService, JobResult } from "../general_service";
import { Channel } from "../../enums/channels";
import { RegisteredService } from "../../enums/names";

/**
 * Periodic fetch the latest pending job
 */
export class RequestJobService extends GeneralService<interfaces.db.JobResultDBInterface> {
  name: RegisteredService = RegisteredService.requestJobService;

  prevKey: string | undefined;

  isPeriodicTask = true;

  targetJobTaskType: enums.JobTaskType;

  async handle(value?: any): Promise<JobResult> {
    const result = await this.remoteClient.emit(
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
      jobResult = await this.handler.handleJob(job);

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

      await this.remoteClient.emit(
        Channel.submitResult,
        data,
        this.config.nodeId
      );

      return data;
    }
    return undefined;
  }

  start(): Promise<any> {
    return Promise.resolve(undefined);
  }
}
