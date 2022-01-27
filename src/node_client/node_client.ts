import Logger from "@etherdata-blockchain/logger";
import { BaseHandler, PluginApp } from "../internal/handlers/base_handler";

interface NamedParam {
  handlers: BaseHandler[];
}

export class NodeClient extends PluginApp {
  constructor({ handlers }: NamedParam) {
    super();
    this.handlers = handlers;
    Logger.info("Start server");
  }
}
