import axios from "axios";
import { enums } from "@etherdata-blockchain/common";
import { randomUUID } from "crypto";
import { CoinbaseHandler } from "../../utils/command";
import { Config } from "../../../config";
import { GeneralService, JobResult } from "../general_service";

export class Web3JobService extends GeneralService<enums.Web3ValueType> {
  config = Config.fromEnvironment();

  targetJobTaskType = enums.JobTaskType.Web3;

  /**
   * Will return a array includes result or error
   * @param method
   * @param params
   * @private
   */
  async handle({ method, params }: enums.Web3ValueType): Promise<JobResult> {
    const result = await axios.post(this.config.rpc, {
      method,
      params,
      jsonrpc: "2.0",
      id: randomUUID(),
    });

    if (!result.data.error) {
      const coinbaseHandler = new CoinbaseHandler();
      if (coinbaseHandler.canHandle({ command: method })) {
        await coinbaseHandler.handle({
          command: method,
          data: { newCoinbase: params[0] },
        });
      }

      return { result: result.data.result, error: undefined };
    }

    return { result: undefined, error: result.data.error.message };
  }

  start(): Promise<any> {
    return Promise.resolve(undefined);
  }
}
