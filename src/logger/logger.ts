import chalk from "chalk";
import moment from "moment";

export class Logger {
  static info(message: any) {
    // eslint-disable-next-line no-console
    console.log(
      `[${chalk.blue("INFO")}] ${chalk.gray(
        moment().format("hh:mm:ss")
      )} ${message}`
    );
  }

  static warning(message: any) {
    // eslint-disable-next-line no-console
    console.log(
      `[${chalk.yellow("WARNING")}] ${chalk.gray(
        moment().format("hh:mm:ss")
      )} ${message}`
    );
  }

  static error(message: any) {
    // eslint-disable-next-line no-console
    console.log(
      `[${chalk.red("Error")}] ${chalk.gray(
        moment().format("hh:mm:ss")
      )} ${message}`
    );
  }
}
