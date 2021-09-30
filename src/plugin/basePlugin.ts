import {Config} from "../config";
import {RemoteAdminClient} from "../node_client/admin-client";

export interface PeriodicTask {
    name: string
    // In seconds
    interval: number

    job(): Promise<void>

    timer?: NodeJS.Timer
}

export type RegisteredPlugin = "webThree"


export abstract class BasePlugin {
    protected abstract pluginName: RegisteredPlugin
    otherPlugin: { [key: string]: BasePlugin } = {}
    periodicTasks: PeriodicTask[]
    config: Config = Config.fromEnvironment()
    remoteAdminClient = new RemoteAdminClient()

    abstract startPlugin(): Promise<void>

    addPlugins(plugins: BasePlugin[]) {
        for (let plugin of plugins) {
            if (plugin.pluginName !== this.pluginName) {
                this.otherPlugin[plugin.pluginName] = plugin
            }
        }

    }

    findPlugin<T extends BasePlugin>(pluginName: string): T {
        let plugin = this.otherPlugin[pluginName]
        if (plugin) {
            //@ts-ignore
            return plugin
        } else {
            throw Error("Cannot find plugin with this name")
        }

    }
}

export abstract class PluginApp {
    plugins: BasePlugin[]

    async startApp() {
        for (const plugin of this.plugins) {
            plugin.addPlugins(this.plugins)
        }

        for (const plugin of this.plugins) {
            await plugin.startPlugin()
        }

        for (const plugin of this.plugins) {
            for (const task of plugin.periodicTasks) {
                task.timer = setInterval(async () => {
                    await task.job()
                }, task.interval * 1000)
            }
        }
    }
}