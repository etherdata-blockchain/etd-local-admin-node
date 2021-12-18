import { config } from "dotenv";
import * as docker from "@pulumi/docker";
import { NodeClient } from "./node_client/node_client";
import Logger from "./logger";
// @ts-ignore
import pjson from "../package.json";

(async () => {
  // config();
  // global.version = pjson.version;
  // Logger.info(`Current version: ${pjson.version}`);
  // const node = new NodeClient({});
  // await node.startApp();

  const image = new docker.RemoteImage("ubuntu", {
    name: "ubuntu:precise",
  });

  const container = new docker.Container("ubuntu", {
    image: image.latest,
  });
})();
