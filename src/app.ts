import { config } from "dotenv";
import Logger from "@etherdata-blockchain/logger";
import { NodeClient } from "./node_client/node_client";
// @ts-ignore
import pjson from "../package.json";
import { JobHandler } from "./internal/handlers/job/job_handler";
import { StatusHandler } from "./internal/handlers/status/status_handler";

(async () => {
  config();
  global.version = pjson.version;
  Logger.info(`Current version: ${pjson.version}`);
  const node = new NodeClient({
    handlers: [new JobHandler(), new StatusHandler()],
  });
  await node.startApp();
})();
