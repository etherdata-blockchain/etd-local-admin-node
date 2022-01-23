import Logger from "../logger";
import { PluginApp } from "../internal/handlers/basePlugin";
import { StatusPlugin } from "../internal/handlers/status/statusPlugin";
import { JobPlugin } from "../internal/handlers/job/jobPlugin";

interface NamedParam {}

export class NodeClient extends PluginApp {
  constructor({}: NamedParam) {
    super();
    this.plugins = [new JobPlugin(), new StatusPlugin()];
    Logger.info("Start server");
  }
}
