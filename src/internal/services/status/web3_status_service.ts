import Web3 from "web3";
import { Admin } from "web3-eth-admin";
import Logger from "@etherdata-blockchain/logger";
import { interfaces } from "@etherdata-blockchain/common";
import { Config } from "../../../config";
import { GeneralService, JobResult } from "../general_service";
import { RegisteredService } from "../../enums/names";

export class Web3StatusService extends GeneralService<any> {
  web3: Web3 | undefined;

  web3Admin: Admin | undefined;

  config: Config = Config.fromEnvironment();

  name = RegisteredService.web3StatusService;

  async start(): Promise<any> {
    const web3 = new Web3(this.config.rpc);
    const admin = new Admin(this.config.rpc);

    this.web3 = web3;
    this.web3Admin = admin;

    return true;
  }

  /**
   * Return the latest block number
   */
  async getLatestBlockNumber(): Promise<number | undefined> {
    try {
      return await this.web3?.eth.getBlockNumber();
    } catch (e) {
      return undefined;
    }
  }

  async handle(): Promise<JobResult> {
    const blockNumber = await this.getLatestBlockNumber();
    const info = await this.prepareWebThreeInfo(blockNumber);
    return info;
  }

  /**
   * Prepare Node Info. When block number is defined, then fetch the latest block
   * and then update the avg block time.
   * @private
   */
  private async prepareWebThreeInfo(
    blockNumber?: number
  ): Promise<interfaces.Web3DataInfo | undefined> {
    if (this.web3 && this.web3Admin) {
      let coinbase: string | undefined;
      let blockTime: number | undefined;
      let avgBlockTime: number | undefined;
      let peerCount: number = 0;
      let isMining: boolean = false;
      let isSyncing: boolean = false;
      let hashRate: number = 0;
      let version: string;
      let currentBlock: any = {};

      const requestBlockNumber = blockNumber ?? 0;

      try {
        const sampleSize = 50;
        const [
          currentBlockResult,
          prevBlockResult,
          prevSampleBlockResult,
          versionResult,
          peerCountResult,
          isMiningResult,
          isSyncingResult,
          hashRateResult,
          coinbaseResult,
        ] = await Promise.allSettled([
          this.web3.eth.getBlock(requestBlockNumber),
          this.web3.eth.getBlock(requestBlockNumber - 1),
          this.web3.eth.getBlock(requestBlockNumber - sampleSize),
          this.web3.eth.getNodeInfo(),
          this.web3.eth.net.getPeerCount(),
          this.web3.eth.isMining(),
          this.web3.eth.isSyncing(),
          this.web3.eth.getHashrate(),
          this.web3.eth.getCoinbase(),
        ]);

        if (
          currentBlockResult.status === "fulfilled" &&
          prevBlockResult.status === "fulfilled" &&
          prevSampleBlockResult.status === "fulfilled"
        ) {
          blockTime =
            (currentBlockResult.value.timestamp as number) -
            (prevBlockResult.value.timestamp as number);

          avgBlockTime =
            ((currentBlockResult.value.timestamp as number) -
              (prevSampleBlockResult.value.timestamp as number)) /
            sampleSize;
          currentBlock = currentBlockResult.value;
        }

        if (versionResult.status === "fulfilled") {
          version = versionResult.value;
        }

        if (peerCountResult.status === "fulfilled") {
          peerCount = peerCountResult.value;
        }

        if (isMiningResult.status === "fulfilled") {
          isMining = isMiningResult.value;
        }

        if (isSyncingResult.status === "fulfilled") {
          if (typeof isSyncingResult.value === "string") {
            isSyncing = true;
          }

          if (typeof isSyncingResult.value === "boolean") {
            isSyncing = isSyncingResult.value;
          }
        }

        if (hashRateResult.status === "fulfilled") {
          hashRate = hashRateResult.value;
        }

        if (coinbaseResult.status === "fulfilled") {
          coinbase = coinbaseResult.value;
        }

        return {
          ...currentBlock,
          systemInfo: {
            // @ts-ignore
            name: this.config.nodeName,
            peerCount,
            isMining,
            isSyncing,
            coinbase,
            nodeVersion: version,
            hashRate,
            nodeId: this.config.nodeId,
          },
          blockTime,
          avgBlockTime,
          peers: [],
        };
      } catch (err) {
        Logger.error(`Preparing web three result encountered error: ${err}`);
      }
    }
    return undefined;
  }
}
