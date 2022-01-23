import axios from "axios";
import { enums } from "@etherdata-blockchain/common";
import { CoinbaseHandler } from "../../utils/command";
import { Config } from "../../../config";
import { GeneralService } from "../general_service";

export class Web3JobService extends GeneralService<enums.Web3ValueType> {
  config = Config.fromEnvironment();

  /**
   * Will return a array includes result or error
   * @param method
   * @param params
   * @private
   */
  async handle({
    method,
    params,
  }: enums.Web3ValueType): Promise<[string | undefined, string | undefined]> {
    const result = await axios.post(this.config.rpc, {
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
