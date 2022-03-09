import { getConnection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '../user/user.entity';
import { UsersService } from '../user/user.service';
import { Account } from '../octet/account.entity';
import { Payment } from '../payment/payment.entity';
import { PlanNameEnum } from '../seed/seed.enums';
import bigDecimal from 'js-big-decimal';
import { Plan } from '../seed/plan.entity';
import { Deposit } from './deposit.entity';
import { DepositWebHook } from './commons/payment.dtos';
import { DepositListInterface } from '../octet/commons/octet.types';
import moment from 'moment';

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
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Deposit Transaction On Webhook Triggered
   * @param user
   * @returns
   */
  public async initDepositTransaction(webhookObj: DepositWebHook) {
    return new Promise<void>(async (resolve, reject) => {
      // get a connection and create a new query runner
      const connection = getConnection();
      const queryRunner = connection.createQueryRunner();
      // establish real database connection using our new query runner
      await queryRunner.connect();
      // lets now open a new transaction:
      await queryRunner.startTransaction();
      try {
        await this.saveDeposit(webhookObj);
        const resultObj = await this.getPaymentByAddress(webhookObj.toAddress);
        this.payment = await this.getPaymentWithDetail(resultObj.paymentId);
        await this.checkKlayRequired(
          this.payment.amountKLAY,
          webhookObj.amount,
        );
        await this.updateStateOfAccount(webhookObj.toAddress);
        await this.detachAccountFromPayment(this.payment);
        await this.updateUserPlan(this.payment.user, this.payment.plan);
        await queryRunner.commitTransaction();
      } catch (err) {
        // since we have errors let's rollback changes we made
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return reject(err);
      } finally {
        // you need to release query runner which is manually created:
        await queryRunner.release();
        return resolve();
      }
    });
  }

  /**
   * Deposit Recovery Transaction On Schedule
   * @param depositListInterfaceObj
   * @returns
   */
  public async initDepositRecoveryTransaction(
    depositListInterfaceObj: DepositListInterface,
  ) {
    return new Promise<void>(async (resolve, reject) => {
      // get a connection and create a new query runner
      const connection = getConnection();
      const queryRunner = connection.createQueryRunner();
      // establish real database connection using our new query runner
      await queryRunner.connect();
      // lets now open a new transaction:
      await queryRunner.startTransaction();
      try {
        await this.saveRecoveryDeposit(depositListInterfaceObj);
        const resultObj = await this.getPaymentByAddress(
          depositListInterfaceObj.to_address,
        );
        this.payment = await this.getPaymentWithDetail(resultObj.paymentId);
        await this.checkKlayRequired(
          this.payment.amountKLAY,
          depositListInterfaceObj.amount,
        );
        await this.updateStateOfAccount(depositListInterfaceObj.to_address);
        await this.detachAccountFromPayment(this.payment);
        await this.updateUserPlan(this.payment.user, this.payment.plan);
        await queryRunner.commitTransaction();
      } catch (err) {
        // since we have errors let's rollback changes we made
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return reject(err);
      } finally {
        // you need to release query runner which is manually created:
        await queryRunner.release();
        return resolve();
      }
    });
  }

  /**
   * Verify The Required Klay Amount
   * @param required
   * @param received
   * @returns
   */
  private checkKlayRequired(required: number, received: string) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const floatReceived = Number(bigDecimal.round(received, 4));
        if (floatReceived < required) {
          return reject();
        }
        return resolve();
      } catch (err) {
        return reject(err);
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
        const sql = `Select p."paymentId" AS payment_Id
                       From accounts a
                       INNER JOIN payments p ON a."position" = p."account"
                       WHERE
                              a."address" = $1`;
        const result = await this.accountRepository.query(sql, [address]);
        return resolve({
          paymentId: result[0].payment_id
        })
      } catch (err) {
        return reject(err);
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
          { relations: ['plan', 'user'] },
        );
        return resolve(payment);
      } catch (err) {
        return reject(err);
      }
    });
  }

  /**
   * SAve Deposit Coming From Webhook
   * @param id
   * @returns
   */
  private async saveDeposit(webhookObject: DepositWebHook) {
    return new Promise<Deposit>(async (resolve, reject) => {
      try {
        const deposit = new Deposit().fromWebhook(webhookObject);
        const newDeposit = await this.depositRepository.save(deposit);
        return resolve(newDeposit);
      } catch (err) {
        return reject(err);
      }
    });
  }

  /**
   * SAve Deposit Coming From Webhook
   * @param id
   * @returns
   */
  private async saveRecoveryDeposit(
    depositListInterfaceObj: DepositListInterface,
  ) {
    return new Promise<Deposit>(async (resolve, reject) => {
      try {
        const deposit = new Deposit().fromDepositList(
          depositListInterfaceObj,
        );
        const newDeposit = await this.depositRepository.save(deposit);
        return resolve(newDeposit);
      } catch (err) {
        return reject(err);
      }
    });
  }

  /**
   * Change Account State From Halt to Free
   * @param address
   * @returns
   */
  private async updateStateOfAccount(address: string) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await this.accountRepository.update({ address }, { isHalt: false });
        return resolve();
      } catch (err) {
        return reject(err);
      }
    });
  }

  /**
   * Detach Account From Payment Object
   * @param payment
   * @returns
   */
  private async detachAccountFromPayment(payment: Payment) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        payment.account = null;
        payment.status = `completed`;
        payment.paidAt = moment().unix();
        await this.paymentRepository.save(payment);
        return resolve();
      } catch (err) {
        return reject(err);
      }
    });
  }

  /**
   * Update Plan Of User
   * @param user
   * @param plan
   * @returns
   */
  private async updateUserPlan(user: User, plan: Plan) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await this.userRepository.update({ uuid: user.uuid }, { plan });
        return resolve();
      } catch (err) {
        return reject(err);
      }
    });
  }
}
