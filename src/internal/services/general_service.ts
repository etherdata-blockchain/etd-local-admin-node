import { enums } from "@etherdata-blockchain/common";
import { Config } from "../../config";

export type JobResult = { error?: string; result: string };

export abstract class GeneralService<T> {
  config = Config.fromEnvironment();

  /**
   * What kind of job can this service handle
   */
  abstract targetJobTaskType: enums.JobTaskType;

  canHandle(jobType: enums.JobTaskType): boolean {
    if (this.targetJobTaskType === jobType) {
      return true;
    }
    return false;
  }

  // eslint-disable-next-line no-unused-vars
  abstract handle(value: T): Promise<JobResult>;

  abstract start(): Promise<any>;
}
