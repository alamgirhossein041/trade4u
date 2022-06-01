import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { LoggerService } from '../../utils/logger/logger.service';
import { TxCount, TxType, BlockQueue, Events } from './commons/scheduler.enum';
import { KlaytnService } from '../klaytn/klaytn.service';
import { TransactionReceipt } from 'caver-js';
import { DepositTransaction } from '../payment/deposit.transaction';
import { CaverService } from '../klaytn/caver.service';
import { BlockProcess } from '../../utils/enum';
import { BonusType, PaymentType } from '../payment/commons/payment.enum';
import { DepositCompletedEvent } from './deposit.complete.event';
import { EventEmitter } from './event.emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Deposit } from '../payment/deposit.entity';
import { Repository } from 'typeorm';
import { SocketService } from '../../modules/socket/socket.service';
import { Notifications } from '../../modules/socket/commons/socket.enum';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';

@Processor(BlockQueue.BLOCK)
export class BlockProcessor {
  private blockHeight: number;

  constructor(
    private readonly depositTransaction: DepositTransaction,
    private eventEmitter: EventEmitter,
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly loggerService: LoggerService,
    private readonly klaytnService: KlaytnService,
    private readonly caverService: CaverService,
    private readonly socketService: SocketService,
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
    return new Promise<string>(async (resolve, reject) => {
      try {
        let txCount: string;
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        this.blockHeight = this.caverService.hexToNumber(job.data.block.number);
        try {
          txCount = await this.caverService.getBlockTransactionCount(
            this.blockHeight,
          );
        } catch (err) {
          await wait(1000);
          txCount = await this.caverService.getBlockTransactionCount(
            this.blockHeight,
          );
        }
        if (txCount === TxCount.ZER0 || !this.klaytnService.listeners.length)
          return resolve('No Transactions In This Block');

        this.loggerService.debug(`Start processing block: ${this.blockHeight}`);
        const txs = await this.filterTransactions(job.data.block);
        await Promise.all(
          txs.map(async (tx) => {
            tx.value = this.caverService.fromPeb(tx.value);
            tx.blockNumber = this.caverService
              .hexToNumber(tx.blockNumber)
              .toString();
            const user = await this.depositTransaction.initDepositTransaction(
              tx,
            );
            const deposit = await this.depositRepository.findOne(
              {
                txHash: tx.transactionHash,
              },
              {
                relations: ['payment'],
              },
            );
            if (deposit) {
              const depositCompletedEvent = new DepositCompletedEvent();
              if (
                deposit.payment.type === PaymentType.TX_PREFORMANCE_BTC ||
                deposit.payment.type === PaymentType.TX_PREFORMANCE_USDT
              ) {
                depositCompletedEvent.bonusType = BonusType.PERFORMANCE;
                await this.socketService.emitNotification(
                  user.email,
                  Notifications.PERFORMANCE_FEE_PAID,
                );
              } else {
                depositCompletedEvent.bonusType = BonusType.LISENCE;
              }
              depositCompletedEvent.user = user;
              depositCompletedEvent.deposit = deposit;
              this.eventEmitter.emit(
                Events.DEPOSIT_COMPLETED,
                depositCompletedEvent,
              );
              this.loggerService.log(`Deposit complete event emitted`);
            }
          }),
        );
        this.loggerService.debug(
          `Process completed block: ${this.blockHeight}`,
        );
        resolve(BlockProcess.PROCESS_COMPLETED);
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
        const recipents = await this.caverService.getBlockReceipts(block.hash);
        const txs = recipents.filter((e) => e.type === TxType.VALUE_TRANSFER || e.type === TxType.LEGACY_TRANSACTION);
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
}
