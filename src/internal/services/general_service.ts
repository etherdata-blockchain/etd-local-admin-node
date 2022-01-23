import { Config } from "../../config";

export abstract class GeneralService<T> {
  config = Config.fromEnvironment();

  // eslint-disable-next-line no-unused-vars
  abstract handle(value: T): Promise<any>;
}
