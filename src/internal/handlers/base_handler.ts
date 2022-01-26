import Logger from "@etherdata-blockchain/logger";
import cron from "node-cron";
import { Config } from "../../config";
import { RemoteAdminClient } from "../remote_client";

export interface PeriodicTask {
  name: string;
  // In seconds
  interval: number;
  job(): Promise<void>;
}

// eslint-disable-next-line no-shadow
export enum RegisteredPlugin {
  jobPlugin = "job-plugin",
  statusPlugin = "status-plugin",
  testPlugin = "test-plugin",
}

export abstract class BaseHandler {
  // eslint-disable-next-line no-use-before-define
  otherPlugin: { [key: string]: BaseHandler } = {};

  periodicTasks: PeriodicTask[];

  config: Config = Config.fromEnvironment();

  remoteAdminClient = new RemoteAdminClient();

  isRunning: boolean = false;

  protected abstract pluginName: RegisteredPlugin;

  async startPlugin(): Promise<void> {
    Logger.info(`Starting services: ${this.pluginName}`);
  }

  addPlugins(plugins: BaseHandler[]) {
    for (const plugin of plugins) {
      if (plugin.pluginName !== this.pluginName) {
        this.otherPlugin[plugin.pluginName] = plugin;
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  protected async tryConnect(
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

  protected wait(time: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }
}

export abstract class PluginApp {
  plugins: BaseHandler[];

  async startApp() {
    for (const plugin of this.plugins) {
      plugin.addPlugins(this.plugins);
    }

    for (const plugin of this.plugins) {
      await plugin.startPlugin();
    }

    for (const plugin of this.plugins) {
      for (const task of plugin.periodicTasks) {
        cron.schedule(`'*/${task.interval} * * * * *'`, async () => {
          await task.job();
        });
      }
    }
  }
}
