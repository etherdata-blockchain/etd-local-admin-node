import { BasePlugin, RegisteredPlugin } from "../basePlugin";
import Logger from "../../logger";
import axios from "axios";
import { CoinbaseHandler, CommandHandler } from "../../command";

interface Web3Value {
  method: string;
  params: string[];
}

interface Task {
  type: string;
  value: Web3Value;
}

export interface PendingJob {
  _id: any;
  targetDeviceId: string;
  /**
   * From client id.
   */
  from: string;
  time: Date;
  task: Task;
}

interface JobResult {
  key: string | undefined;
  jobId: string;
  time: Date;
  deviceID: string;
  /**
   * From which client. This will be the unique id
   */
  from: string;
  command: any;
  result: any;
  success: boolean;
}

export class JobPlugin extends BasePlugin {
  protected pluginName: RegisteredPlugin = "jobPlugin";
  prevKey: string | undefined;

  constructor() {
    super();
    this.periodicTasks = [
      {
        name: "Get pending job",
        interval: 3,
        job: this.requestJob.bind(this),
      },
    ];
  }

  override async startPlugin(): Promise<void> {
    await super.startPlugin();
    await this.startJobSystemConnection();
  }

  private async startJobSystemConnection() {
    await this.tryConnect(
      async () => {
        await this.remoteAdminClient.emit("health", "", "");
        return true;
      },
      async () => {
        Logger.error(`Cannot connect to remote admin server`);
      }
    );
    Logger.info("Connected to Admin server");
  }

  async requestJob() {
    let result = await this.remoteAdminClient.emit(
      "request-job",
      { nodeName: this.config.nodeName, key: this.prevKey },
      this.config.nodeId
    );

    if (result) {
      this.prevKey = result.key;
    }

    const job: PendingJob | undefined = result?.job;
    let jobResult: [string | undefined, string | undefined] = [
      undefined,
      undefined,
    ];

    if (job && job.task) {
      Logger.info("Getting job: " + job.task.type);
      switch (job.task.type) {
        case "web3":
          jobResult = await this.handleWeb3Job(job.task.value);
          break;

        default:
          Logger.error(`${job.task.type} is not supported`);
      }

      let data: JobResult = {
        jobId: job._id,
        command: job.task.value,
        deviceID: this.config.nodeId,
        from: job.from,
        result: jobResult[0] ?? jobResult[1],
        success: jobResult[1] === undefined,
        time: new Date(),
        key: this.prevKey,
      };

      await this.remoteAdminClient.emit(
        "submit-result",
        data,
        this.config.nodeId
      );
    }
  }

  /**
   * Will return a array includes result or error
   * @param method
   * @param params
   * @private
   */
  private async handleWeb3Job({
    method,
    params,
  }: Web3Value): Promise<[string | undefined, string | undefined]> {
    let result = await axios.post(this.config.rpc, {
      method,
      params,
      jsonrpc: "2.0",
      id: 1,
    });

    if (!result.data.error) {
      const coinbaseHandler = new CoinbaseHandler();
      if (coinbaseHandler.canHandle({ command: method })) {
        await coinbaseHandler.handle({
          command: method,
          data: { newCoinbase: params[0] },
        });
      }

      return [result.data.result, undefined];
    }

    return [undefined, result.data.error.message];
  }
}
