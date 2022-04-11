import { Config } from "../../config";
import { RemoteAdminClient } from "../remote_client";
import { BaseHandler } from "../handlers/base_handler";
import { RegisteredService } from "../enums/names";

export type JobResult = { error?: string; result: string } | any;

export abstract class GeneralService<T> {
  /**
   * Name of this service.
   */
  abstract name: RegisteredService;

  /**
   * System configuration
   */
  config = Config.fromEnvironment();

  isPeriodicTask: boolean = false;

  handler: BaseHandler;

  /**
   * Remote client for any remote connection
   */
  protected remoteClient = new RemoteAdminClient();

  /**
   * Implement this function to handle the job
   * @param value
   */
  // eslint-disable-next-line no-unused-vars
  abstract handle(value?: T): Promise<JobResult>;

  /**
   * Implement this function to do any initialization of your service
   */
  abstract start(): Promise<any>;
}
