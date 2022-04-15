import { getConnection, QueryRunner, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '../user/user.entity';
import { Account } from '../klaytn/account.entity';
import { Payment } from '../payment/payment.entity';
import { Plan } from '../seed/plan.entity';
import { Deposit } from './deposit.entity';
import moment from 'moment';
import { PaymentStatus } from './commons/payment.enum';
import { TransactionReceipt } from 'caver-js';
import { KlaytnService } from '../../modules/klaytn/klaytn.service';
import { CaverService } from '../../modules/klaytn/caver.service';
import bigDecimal from 'js-big-decimal';
import { UserStats } from '../user/user-stats.entity';
import { LoggerService } from '../../utils/logger/logger.service';

@Injectable()
export class DepositTransaction {
  private payment: Payment;
  /**
   *
   * @param accountRepository
   * @param paymentRepository
   * @param userRepository
   */
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly klaytnService: KlaytnService,
    private readonly caverService: CaverService,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.setContext('DepositTransaction');
  }

  /**
   * Deposit Transaction On Webhook Triggered
   * @param webhookObj
   * @returns
   */
  public async initDepositTransaction(tx: TransactionReceipt) {
    this.loggerService.log('Deposit Transaction Started');
    return new Promise<User>(async (resolve, reject) => {
      // get a connection and create a new query runner
      const connection = getConnection();
      const queryRunner = connection.createQueryRunner();
      // establish real database connection using our new query runner
      await queryRunner.connect();
      // lets now open a new transaction:
      await queryRunner.startTransaction();
      try {
        const resultObj = await this.getPaymentByAddress(tx.to);
        this.payment = await this.getPaymentWithDetail(resultObj.paymentId);
        const isValidated = await this.validatePlanActivation();
        if (isValidated) {
          await this.saveDeposit(tx, queryRunner);
          await this.updateStateOfAccount(tx.to, queryRunner);
          await this.detachAccountFromPayment(queryRunner);
          await this.updateUserPlan(
            this.payment.user,
            this.payment.plan,
            queryRunner,
          );
          await this.caverService.moveToMasterWallet(tx.to);
          await this.klaytnService.removeListener(tx.to);
        }
        await queryRunner.commitTransaction();
      } catch (err) {
        // since we have errors let's rollback changes we made
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        this.loggerService.error('Error In Deposit Transaction');
        reject(err);
      } finally {
        // you need to release query runner which is manually created:
        await queryRunner.release();
        this.loggerService.log('Deposit Transaction Completed');
        resolve(this.payment.user);
      }
    });
  }

  /**
   * Verify The Required Klay Amount
   * @returns
   */
  private validatePlanActivation(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const balance = await this.klaytnService.getAccountBalance(
          this.payment.account.address,
        );
        Number(balance) >= this.payment.amountKLAY
          ? resolve(true)
          : resolve(false);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Get Payment From Address
   * @param address
   * @returns
   */
  private async getPaymentByAddress(address: string) {
    return new Promise<{ paymentId: string }>(async (resolve, reject) => {
      try {
        const sql = `SELECT 
                        payments."paymentId" AS pid
                      FROM 
                        payments  
                      WHERE
                        payments."account" = $1`;
        const result = await this.accountRepository.query(sql, [address]);
        resolve({
          paymentId: result[0].pid,
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Get Payment Object From Payment Id
   * @param id
   * @returns
   */
  private async getPaymentWithDetail(id: string) {
    return new Promise<Payment>(async (resolve, reject) => {
      try {
        const payment = await this.paymentRepository.findOne(
          { paymentId: id },
          { relations: ['plan', 'user', 'user.userStats', 'account'] },
        );
        resolve(payment);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Save Deposit Transaction Coming From Klaytn BlockChain
   * @param tx
   * @param queryRunner
   * @returns
   */
  private async saveDeposit(tx: TransactionReceipt, queryRunner: QueryRunner) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const deposit = new Deposit().fromTransaction(tx);
        deposit.payment = this.payment;
        deposit.account = this.payment.account;
        await queryRunner.manager.save(deposit);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Change Account State From Halt to Free
   * @param address
   * @returns
   */
  private async updateStateOfAccount(
    address: string,
    queryRunner: QueryRunner,
  ) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const account = await this.accountRepository.findOne({ address });
        account.isHalt = false;
        await queryRunner.manager.save(account);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Detach Account From Payment Object
   * @param queryRunner
   * @returns
   */
  private async detachAccountFromPayment(queryRunner: QueryRunner) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        this.payment.account = null;
        this.payment.status = PaymentStatus.COMPLETED;
        this.payment.paidAt = moment().unix();
        await queryRunner.manager.save(this.payment);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Update Plan Of User
   * @param user
   * @param plan
   * @returns
   */
  private async updateUserPlan(
    user: User,
    plan: Plan,
    queryRunner: QueryRunner,
  ) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        user.plan = plan;
        await this.updateUserStats(
          user.userStats,
          plan,
          user.planIsActive,
          queryRunner,
        );
        if (!user.planIsActive) user.planIsActive = true;
        user.planExpiry = moment().add(1, 'year').unix();
        await queryRunner.manager.save(user);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Update Stats Of User
   * @param userStats
   * @param plan
   * @returns
   */
  private async updateUserStats(
    userStats: UserStats,
    plan: Plan,
    planIsActive: boolean,
    queryRunner: QueryRunner,
  ) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const planLimit = Number(plan.limit.split('')[0]);
        const earningLimit = Number(
          new bigDecimal(planLimit)
            .multiply(new bigDecimal(plan.price))
            .getValue(),
        );
        if (planIsActive) {
          const remainingAmount = Number(
            new bigDecimal(userStats.earning_limit)
              .subtract(new bigDecimal(userStats.consumed_amount))
              .getValue(),
          );
          const newEarningLimit = Number(
            new bigDecimal(remainingAmount)
              .add(new bigDecimal(earningLimit))
              .getValue(),
          );
          userStats.earning_limit = newEarningLimit;
        } else {
          userStats.earning_limit = earningLimit;
        }
        await queryRunner.manager.save(userStats);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
}
