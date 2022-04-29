import Logger from "@etherdata-blockchain/logger";
import cron from "node-cron";
import { Config, DefaultSettings } from "../../config";
import { RemoteAdminClient } from "../remote_client";
import { GeneralService, JobResult } from "../services/general_service";
import { RegisteredHandler, RegisteredService } from "../enums/names";

export interface PeriodicTask {
  name: string;
  // In seconds
  interval: number;

  job(): Promise<void>;
}

export abstract class BaseHandler {
  // eslint-disable-next-line no-use-before-define
  otherHandlers: { [key: string]: BaseHandler } = {};

  periodicTasks: PeriodicTask[] = [];

  config: Config = Config.fromEnvironment();

  remoteClient = new RemoteAdminClient();

  isRunning: boolean = false;

  protected abstract handlerName: RegisteredHandler;

  private services: GeneralService<any>[] = [];

  private servicesMap: { [key: string]: GeneralService<any> } = {};

  addService(service: GeneralService<any>) {
    if (service.name === undefined) {
      throw new Error("Service name must be defined");
    }
    this.servicesMap[service.name] = service;
    this.services = Object.values(this.servicesMap);
    return this;
  }

  async startHandler(): Promise<void> {
    Logger.info(`Starting services: ${this.handlerName}`);
    // add periodic tasks from services
    for (const service of this.services) {
      Logger.info(`Initialize service ${service.name}`);
      service.handler = this;
      if (service.isPeriodicTask) {
        this.periodicTasks.push({
          interval: DefaultSettings.jobInterval,
          job: service.handle.bind(service),
          name: service.name,
        });
      }
      await service.start();
    }
  }

  /**
   * Get service by name
   * @param serviceName requested service name
   */
  findServiceByName<T extends GeneralService<any>>(
    serviceName: RegisteredService
  ): T | undefined {
    return this.servicesMap[serviceName] as T;
  }

  addHandlers(handlers: BaseHandler[]) {
    for (const handler of handlers) {
      if (handler.handlerName !== this.handlerName) {
        this.otherHandlers[handler.handlerName] = handler;
      }
    }
  }

  findHandlerByName(handlerName: string) {
    return this.otherHandlers[handlerName];
  }

  // eslint-disable-next-line class-methods-use-this
  async tryConnect(
    job: () => Promise<boolean>,
    onError: (e: any) => Promise<void>
  ) {
    let isConnected = false;
    while (!isConnected) {
      try {
        isConnected = await job();
      } catch (e) {
        await onError(e);
        isConnected = false;
      }
    }
  }

  /**
   * Util function. Promise based set timeout function
   * @param time
   */
  wait(time: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  /**
   * Handle job based on different job task type
   * @param job
   * @private
   */
  async handleJob(job: any): Promise<JobResult | undefined> {
    Logger.info(`Handling job by handler: ${this.handlerName}`);
    return undefined;
  }
}

export abstract class PluginApp {
  handlers: BaseHandler[];

  async startApp() {
    for (const plugin of this.handlers) {
      plugin.addHandlers(this.handlers);
    }

    for (const plugin of this.handlers) {
      await plugin.startHandler();
    }

    for (const plugin of this.handlers) {
      for (const task of plugin.periodicTasks) {
        cron.schedule(`'*/${task.interval} * * * * *'`, async () => {
          await task.job();
        });
      }
    }
  }
}
