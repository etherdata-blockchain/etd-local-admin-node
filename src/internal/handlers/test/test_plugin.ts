import Logger from "@etherdata-blockchain/logger";
import { utils } from "@etherdata-blockchain/common";
import moment from "moment";
import { BaseHandler, RegisteredPlugin } from "../base_handler";

export class TestPlugin extends BaseHandler {
  protected pluginName: RegisteredPlugin = RegisteredPlugin.testPlugin;

  constructor() {
    super();
    this.periodicTasks = [
      {
        name: "latest-node-info",
        interval: 3,
        job: this.printData.bind(this),
      },
      {
        name: "latest-node-info",
        interval: 5,
        job: this.printData2.bind(this),
      },
    ];
  }

  async printData() {
    const start = moment();
    await utils.sleep(5000);
    Logger.info(`[1] Start at ${start}`);
  }

  async printData2() {
    const start = moment();
    await utils.sleep(5000);
    Logger.info(`[2] Start at ${start}`);
  }
}
