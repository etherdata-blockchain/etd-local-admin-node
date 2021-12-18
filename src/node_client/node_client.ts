import moment from "moment";
import osu from "os-utils";
import os from "os";
import { SystemInfo } from "../internal/interfaces/systemInfo";
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

  private async prepareSystemInfo(): Promise<SystemInfo[]> {
    const memoryFree = os.freemem();
    const sysUpTime = osu.sysUptime();
    const cpuUsage: number = await new Promise((resolve, reject) => {
      osu.cpuUsage((u) => {
        resolve(u);
      });
    });

    return [
      {
        title: "CPU",
        description: "CPU Usage",
        value: (cpuUsage * 100).toFixed(2),
        unit: "%",
      },
      {
        title: "Mem Free",
        description: "Memory Free",
        value: (memoryFree / 1024 / 1024 / 1024).toFixed(2),
        unit: "GB",
      },
      {
        title: "Up Time",
        description: "System Up Time",
        value: moment({}).seconds(sysUpTime).format("HH:mm:ss"),
        unit: "",
      },
    ];
  }
}
