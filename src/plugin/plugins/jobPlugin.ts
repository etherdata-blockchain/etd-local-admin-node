import {BasePlugin, RegisteredPlugin} from "../basePlugin";
import Logger from "../../logger";

interface Task {
    type: string;
    value: any;
}

export interface PendingJob {
    targetDeviceId: string;
    /**
     * From client id.
     */
    from: string;
    time: Date;
    task: Task;
}

export class JobPlugin extends BasePlugin{
    protected pluginName: RegisteredPlugin = "jobPlugin";

    constructor() {
        super();
        this.periodicTasks = []
    }

    async startPlugin(): Promise<void> {
        Logger.info("Starting Job Plugin")
    }

}