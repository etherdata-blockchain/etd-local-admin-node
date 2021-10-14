import { Config } from "../config";
import { RemoteAdminClient } from "../node_client/admin-client";
import Logger from "../logger";

export interface PeriodicTask {
  name: string;
  // In seconds
  interval: number;

  job(): Promise<void>;

  timer?: NodeJS.Timer;
}

export type RegisteredPlugin = "webThree" | "jobPlugin";

export abstract class BasePlugin {
  protected abstract pluginName: RegisteredPlugin;
  otherPlugin: { [key: string]: BasePlugin } = {};
  periodicTasks: PeriodicTask[];
  config: Config = Config.fromEnvironment();
  remoteAdminClient = new RemoteAdminClient();
  isRunning: boolean = false;

  async startPlugin(): Promise<void> {
    Logger.info("Starting plugin: " + this.pluginName);
  }

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

  addPlugins(plugins: BasePlugin[]) {
    for (let plugin of plugins) {
      if (plugin.pluginName !== this.pluginName) {
        this.otherPlugin[plugin.pluginName] = plugin;
      }
    }
  }

  findPlugin<T extends BasePlugin>(pluginName: string): T {
    let plugin = this.otherPlugin[pluginName];
    if (plugin) {
      //@ts-ignore
      return plugin;
    } else {
      throw Error("Cannot find plugin with this name");
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
  plugins: BasePlugin[];

  async startApp() {
    for (const plugin of this.plugins) {
      plugin.addPlugins(this.plugins);
    }

    for (const plugin of this.plugins) {
      await plugin.startPlugin();
    }

    for (const plugin of this.plugins) {
      for (const task of plugin.periodicTasks) {
        task.timer = setInterval(async () => {
          if (!plugin.isRunning) {
            plugin.isRunning = true;
            await task.job();
            plugin.isRunning = false;
          } else {
            Logger.warning("Previous job is running, skipping!");
          }
        }, task.interval * 1000);
      }
    }
  }
}
