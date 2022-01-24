import Logger from "@etherdata-blockchain/logger";
import { utils } from "@etherdata-blockchain/common";
import moment from "moment";
import { Base_handler, RegisteredPlugin } from "../basePlugin";
import { Web3StatusService } from "../../services/status/web3_status_service";
import { DockerStatusService } from "../../services/status/docker_status_service";

export class TestPlugin extends Base_handler {
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
