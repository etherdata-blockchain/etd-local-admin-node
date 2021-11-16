import { NodeClient } from "./node_client/node_client";
import Logger from "./logger";
import { config } from "dotenv";
//@ts-ignore
import pjson from "../package.json";

(async () => {
  config();
  global.version = pjson.version;
  Logger.info(`Current version: ${pjson.version}`);
  const node = new NodeClient({});
  await node.startApp();
})();
