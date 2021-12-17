import { config } from "dotenv";
import { NodeClient } from "./node_client/node_client";
import Logger from "./logger";
// @ts-ignore
import pjson from "../package.json";

(async () => {
  config();
  global.version = pjson.version;
  Logger.info(`Current version: ${pjson.version}`);
  const node = new NodeClient({});
  await node.startApp();
})();
