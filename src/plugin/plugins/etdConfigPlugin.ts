import { BasePlugin, RegisteredPlugin } from "../basePlugin";
import Web3 from "web3";
import { Admin } from "web3-eth-admin";
import Logger from "../../logger";
import { Web3DataInfo } from "../../node_client/web3DataInfo";
import Docker, { ContainerInfo, ImageInfo } from "dockerode";

export class etdConfigPlugin extends BasePlugin {
    protected pluginName: RegisteredPlugin = "etdConfigPlugin";
    web3: Web3 | undefined;
    web3Admin: Admin | undefined;
    // In MS
    prevKey: string | undefined;
    private dockerClient: Docker;

    constructor() {
        super();
        this.periodicTasks = [
            {
                name: "get etdConfig",
                interval: 15,
                job: this.GetETDConfig.bind(this),
            },
        ];
    }

    override async startPlugin(): Promise<void> {

    }

    async GetETDConfig(): Promise<void> {

    }
}
