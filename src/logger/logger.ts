import moment from "moment";

export class Logger {
  static info(message: any) {
    // eslint-disable-next-line no-console
    console.log(`[INFO] ${moment().format("hh:mm:ss")} ${message}`);
  }

  static warning(message: any) {
    // eslint-disable-next-line no-console
    console.log(`[WARNING] ${moment().format("hh:mm:ss")} ${message}`);
  }

  static error(message: any) {
    // eslint-disable-next-line no-console
    console.log(`[Error] ${moment().format("hh:mm:ss")} ${message}`);
  }
}
