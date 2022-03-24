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
  ) {}

  /**
   * Deposit Transaction On Webhook Triggered
   * @param webhookObj
   * @returns
   */
  public async initDepositTransaction(tx: TransactionReceipt) {
    return new Promise<void>(async (resolve, reject) => {
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
        await this.saveDeposit(tx, queryRunner);
        const isValidated = await this.validatePlanActivation();
        if (isValidated) {
          await this.updateStateOfAccount(tx.to, queryRunner);
          await this.detachAccountFromPayment(this.payment, queryRunner);
          await this.updateUserPlan(
            this.payment.user,
            this.payment.plan,
            queryRunner,
          );
          await this.klaytnService.moveToMasterWallet(tx.to);
          await this.klaytnService.removeListener(tx.to);
        }
        await queryRunner.commitTransaction();
      } catch (err) {
        // since we have errors let's rollback changes we made
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        reject(err);
      } finally {
        // you need to release query runner which is manually created:
        await queryRunner.release();
        resolve();
      }
    });
  }

  /**
   * Verify The Required Klay Amount
   * @param required
   * @param received
   * @returns
   */
  private validatePlanActivation(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const balance = await this.klaytnService.getAccountBalance(
          this.payment.account.address,
        );
        Number(balance) > this.payment.amountKLAY
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
          { relations: ['plan', 'user', 'account'] },
        );
        resolve(payment);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * SAve Deposit Coming From Webhook
   * @param webhookObject
   * @returns
   */
  private async saveDeposit(tx: TransactionReceipt, queryRunner: QueryRunner) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const deposit = new Deposit().fromTransaction(tx);
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
   * @param payment
   * @returns
   */
  private async detachAccountFromPayment(
    payment: Payment,
    queryRunner: QueryRunner,
  ) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        payment.account = null;
        payment.status = PaymentStatus.COMPLETED;
        payment.paidAt = moment().unix();
        await queryRunner.manager.save(payment);
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
        user.planIsActive = true;
        await queryRunner.manager.save(user);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
}
