import Web3 from "web3";
import { Admin } from "web3-eth-admin";
import Logger from "@etherdata-blockchain/logger";
import { interfaces } from "@etherdata-blockchain/common";
import { Config } from "../../../config";

export class Web3StatusService {
  web3: Web3 | undefined;

  web3Admin: Admin | undefined;

  // In MS
  prevKey: string | undefined;

  config: Config = Config.fromEnvironment();

  async connect() {
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

  /**
   * Prepare Node Info
   * @private
   */
  async prepareWebThreeInfo(
    blockNumber: number
  ): Promise<interfaces.Web3DataInfo | undefined> {
    if (this.web3 && this.web3Admin) {
      let coinbase: string | undefined;
      let balance: string | undefined;

      try {
        const sampleSize = 50;
        const [
          currentBlock,
          prevBlock,
          prevSampleBlock,
          version,
          peerCount,
          isMining,
          isSyncing,
          hashRate,
        ] = await Promise.all([
          this.web3.eth.getBlock(blockNumber),
          this.web3.eth.getBlock(blockNumber - 1),
          this.web3.eth.getBlock(blockNumber - sampleSize),
          this.web3.eth.getNodeInfo(),
          this.web3.eth.net.getPeerCount(),
          this.web3.eth.isMining(),
          this.web3.eth.isSyncing(),
          this.web3.eth.getHashrate(),
        ]);

        const blockTime =
          (currentBlock.timestamp as number) - (prevBlock.timestamp as number);
        const avgBlockTime =
          ((currentBlock.timestamp as number) -
            (prevSampleBlock.timestamp as number)) /
          sampleSize;

        try {
          coinbase = await this.web3.eth.getCoinbase();
          balance = await this.web3.eth.getBalance(coinbase);
        } catch (err) {
          Logger.error(`${err}`);
        }

        return {
          ...currentBlock,
          balance,
          systemInfo: {
            // @ts-ignore
            name: this.config.nodeName,
            peerCount,
            isMining,
            isSyncing: isSyncing as boolean,
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
        Logger.error(`Cannot connect to the RPC Endpoint: ${err}`);
      }
    }
    return undefined;
  }
}
