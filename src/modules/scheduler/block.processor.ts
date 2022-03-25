import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { LoggerService } from '../../utils/logger/logger.service';
import { TxCount, TxType, BlockQueue } from './commons/scheduler.enum';
import { KlaytnService } from '../klaytn/klaytn.service';
import { TransactionReceipt } from 'caver-js';
import { DepositTransaction } from '../../modules/payment/deposit.transaction';

@Processor(BlockQueue.BLOCK)
export class BlockProcessor {
  private blockHeight: number;

  constructor(
    private readonly depositTransaction: DepositTransaction,
    private readonly loggerService: LoggerService,
    private readonly klaytnService: KlaytnService,
  ) {
    this.loggerService.setContext('BlockProcessor');
  }
  /**
   * Process a block as job from redis queue
   * @param job
   * @returns
   */
  @Process(BlockQueue.BLOCK)
  public handleBlock(job: Job) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        this.blockHeight = Number(
          this.klaytnService.caver.utils.hexToNumber(job.data.block.number),
        );
        const txCount =
          await this.klaytnService.caver.rpc.klay.getBlockTransactionCountByNumber(
            this.blockHeight,
          );
        if (txCount === TxCount.ZER0 || !this.klaytnService.listeners.length)
          return resolve();

        this.loggerService.debug(`Start processing block: ${this.blockHeight}`);
        const txs = await this.filterTransactions(job.data.block);
        await Promise.all(
          txs.map(async (tx) => {
            tx.value = this.klaytnService.caver.utils.fromPeb(
              this.klaytnService.caver.utils.hexToNumberString(tx.value),
            );
            tx.blockNumber = this.klaytnService.caver.utils.hexToNumber(
              tx.blockNumber,
            );
            await this.depositTransaction.initDepositTransaction(tx);
          }),
        );
        this.loggerService.debug(
          `Process completed block: ${this.blockHeight}`,
        );
        resolve();
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }
  /**
   * Filter transactions from block
   * @param block
   * @returns
   */
  public async filterTransactions(block): Promise<TransactionReceipt[]> {
    return new Promise<TransactionReceipt[]>(async (resolve, reject) => {
      try {
        const recipents = await this.klaytnService.caver.klay.getBlockReceipts(
          block.hash,
        );
        const txs = recipents.filter((e) => e.type === TxType.VALUE_TRANSFER);
        const recipentsAddresses = txs
          .map((t) => t.to)
          .filter((value) => this.klaytnService.listeners.includes(value));
        const result = txs.filter((tx) => recipentsAddresses.includes(tx.to));
        return resolve(result);
      } catch (err) {
        return reject();
      }
    });
  }

  // @OnQueueActive()
  // onActive(job: Job) {
  // console.log(
  //   `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
  // );
  //}
}
