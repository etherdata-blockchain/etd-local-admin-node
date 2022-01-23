import Logger from "@etherdata-blockchain/logger";
import { PluginApp } from "../internal/handlers/basePlugin";
import { StatusPlugin } from "../internal/handlers/status/status_plugin";
import { JobPlugin } from "../internal/handlers/job/job_plugin";
import { TestPlugin } from "../internal/handlers/test/test_plugin";

interface NamedParam {}

export class NodeClient extends PluginApp {
  constructor({}: NamedParam) {
    super();
    this.plugins = [new TestPlugin()];
    Logger.info("Start server");
  }
}
