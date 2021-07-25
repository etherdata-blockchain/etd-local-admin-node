import Web3 from "web3";
import { Block, Transaction } from "web3-eth";
import { Admin } from "web3-eth-admin";

export class Web3Helper {
  static async getTransactions(
    transactionsId: string[]
  ): Promise<Transaction[]> {
    let web3 = new Web3(Web3.givenProvider || process.env.rpc!);
    return await Promise.all(
      transactionsId.map((id) => web3.eth.getTransaction(id))
    );
  }

  static async getBlockById(blockId: string): Promise<Block | undefined> {
    let web3 = new Web3(Web3.givenProvider || process.env.rpc!);
    try {
      return await web3.eth.getBlock(blockId);
    } catch (err) {
      return undefined;
    }
  }

  /**
   * Calculate block reward
   * @param block
   */
  static async calculateReward(block: Block): Promise<number> {
    let fee = 0;
    let basicReward = 57.87;
    let unclesFixedReward = (block.uncles.length / 32) * basicReward;
    let unclesReward = 0;

    let transactions = await Web3Helper.getTransactions(
      block.transactions as string[]
    );

    // calculate basic fee
    transactions.forEach((t) => (fee += t.gas * parseFloat(t.gasPrice)));

    block.uncles.map(async (u) => {
      let ub = await Web3Helper.getBlockById(u);
      if (ub) {
        unclesReward += (ub.number + 8 - block.number) * basicReward;
      }
    });

    return fee + basicReward + unclesReward + unclesFixedReward;
  }
}
