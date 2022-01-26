import Logger from "@etherdata-blockchain/logger";
import { PluginApp } from "../internal/handlers/base_handler";
import { TestPlugin } from "../internal/handlers/test/test_plugin";

interface NamedParam {}

export class NodeClient extends PluginApp {
  constructor({}: NamedParam) {
    super();
    this.plugins = [new TestPlugin()];
    Logger.info("Start server");
  }
}
