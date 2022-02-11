import { enums } from "@etherdata-blockchain/common";
import { Config } from "../../config";
import { RemoteAdminClient } from "../remote_client";

export type JobResult = { error?: string; result: string };

export abstract class GeneralService<T> {
  /**
   * System configuration
   */
  config = Config.fromEnvironment();

  /**
   * Remote client for any remote connection
   */
  protected remoteClient = new RemoteAdminClient();

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

  /**
   * Implement this function to handle the job
   * @param value
   */
  // eslint-disable-next-line no-unused-vars
  abstract handle(value: T): Promise<JobResult>;

  /**
   * Implement this function to do any initialization of your service
   */
  abstract start(): Promise<any>;
}
