import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SeedService } from '../../modules/seed/seed.service';
import { getConnection, Repository,LessThanOrEqual } from 'typeorm';
import { BonusType, PaymentStatus } from './commons/payment.enum';
import { Payment } from './payment.entity';
import moment from 'moment';
import { SchedulerService } from '../../modules/scheduler/scheduler.service';
import bigDecimal from 'js-big-decimal';
import ShortUniqueId from 'short-unique-id';
import { User } from '../user/user.entity';
import {
  paginate,
  Pagination,
  IPaginationOptions,
} from 'nestjs-typeorm-paginate';
import { ResponseCode, ResponseMessage } from '../../utils/enum';
import { OctetService } from '../octet/octet.service';
import { Account } from '../octet/account.entity';
import { Deposit } from './deposit.entity';
import { DepositTransaction } from './deposit.transaction';
import { DepositListInterface } from '../octet/commons/octet.types';
import { DepositWebHook } from './commons/payment.dtos';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JOB } from '../../modules/scheduler/commons/scheduler.enum';
import { LoggerService } from '../../utils/logger/logger.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
    private readonly seedService: SeedService,
    private readonly depositTransaction: DepositTransaction,
    private readonly octetService: OctetService,
    private readonly loggerServce: LoggerService,
  ) { }

  /**
   * Make payment
   */
  public async makePayment() { }

  /**
   * Get user payments
   */
  public async getPayments(user: User, paginationOption: IPaginationOptions) {
    const condition = { user: user };
    const payment = await this.paginate(paginationOption, condition);
    if (!payment.items.length) {
      throw new HttpException(
        `Payment ${ResponseMessage.CONTENT_NOT_FOUND}`,
        ResponseCode.CONTENT_NOT_FOUND,
      );
    }
    return { items: payment.items, meta: payment.meta };
  }

  /**
   * Initialize the Deposit Recovery Process
   */
  public async initDepositRecoveryProcess() {
    return new Promise<void>(async (resolve, reject) => {
      const haltAccounts = await this.octetService.getHaltedAcocounts();
      if (!haltAccounts.length) return resolve();
      haltAccounts.map(async (account) => {
        const depositsCount = await this.getAccountDepositsCount(account.address);
        const octetDepositsCount = await this.getAccountDepositsCountFromOctet(
          account.address
        );
        if (octetDepositsCount > depositsCount) {
          let newDeposit: DepositListInterface;
          const lastDeposit: Deposit = await this.getAccountLastDeposit(account.address);
          if (lastDeposit) {
            const startDate = moment.unix(lastDeposit.dwDate + 1).format('YYYY-MM-DDTHH:mm:ss');
            newDeposit = await this.getNewDepositFromOctet(account.address, startDate);
          } else {
            newDeposit = await this.getNewDepositFromOctet(account.address);
          }
          await this.depositTransaction
            .initDepositRecoveryTransaction(newDeposit)
            .catch((err) => {
              return reject(
                `${ResponseMessage.DEPOSIT_RECOVERY_PROCESS_ERROR} for address ${newDeposit.to_address}`,
              );
            });
        }
        return resolve();
      });
    });
  }

  /**
   * Initialize the Deposit Recovery Process
   */
  public async initDepositTransaction(body: DepositWebHook) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await this.depositTransaction.initDepositTransaction(body)
          .catch((err) => {
            throw err;
          });
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
* Array Filter Opration
* @param list1
* @param list2
* @returns
*/
  public getDifference(list1, list2) {
    return list1.filter(object1 => {
      return !list2.some(object2 => {
        return object1.id === object2.id;
      });
    });
  }

  public getNewDeposits(list1, list2): DepositListInterface[] {
    return this.getDifference(list2, list1);
  }

  /**
   * Get Deposit List Of Account
   */
  public async getAccountDeposits(address: string) {
    const deposits = await this.depositRepository.find({ toAddress: address });
    return deposits;
  }


  /**
   * Get Deposits Count Of Account
   */
  public async getAccountDepositsCount(address: string) {
    const sql = `SELECT COUNT(DISTINCT(id)) as total_deposits FROM deposits WHERE "toAddress"=$1`;
    const result = await this.depositRepository.query(sql, [address]);
    return Number(result[0].total_deposits);
  }

  /**
   * Get Last Deposit Of Account
   */
  public async getAccountLastDeposit(address: string) {
    const sql = `SELECT * FROM deposits WHERE "toAddress"=$1 ORDER BY id DESC LIMIT 1`;
    const result = await this.depositRepository.query(sql, [address]);
    return result[0];
  }

  /**
   * Get Deposit List Of Account From Octet
   */
  public async getAccountDepositsFromOctet(address: string) {
    const octetDeposits = await this.octetService.getAccountDepositList(
      address,
    );
    return octetDeposits;
  }

  /**
   * Get Deposit List Of Account From Octet
   */
  public async getNewDepositFromOctet(address: string, startDate?: string) {
    let octetDeposit: DepositListInterface;
    if (startDate) {
      octetDeposit = await this.octetService.getnewDeposit(
        address,
        startDate
      );
    } else {
      octetDeposit = await this.octetService.getnewDeposit(
        address
      );
    }
    return octetDeposit;
  }

  /**
   * Get Deposits Count Of Account From Octet
   */
  public async getAccountDepositsCountFromOctet(address: string) {
    const octetDepositsCount = await this.octetService.getAccountDepositsCount(
      address,
    );
    return octetDepositsCount;
  }

  /**
   * Create order for business plan
   * @param planId
   */
  public async orderPlan(user: User, planId: number): Promise<Payment> {
    return new Promise<Payment>(async (resolve, reject) => {
      try {
        const payment = await this.createPayment(user, planId);
        return resolve(await this.paymentRepository.save(payment));
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Create payment
   * @param planId
   * @returns
   */
  public async createPayment(user: User, planId: number) {
    const plan = await this.seedService.getPlanById(planId);
    const uid = new ShortUniqueId({ length: 10 });
    const payment = new Payment();
    payment.paymentId = uid();
    payment.amountUSD = plan.price;
    payment.status = PaymentStatus.PENDING;
    payment.createdAt = moment().unix();
    payment.expireAt = payment.createdAt + 3600; // one hour after creation
    payment.amountKLAY = Number(
      new bigDecimal(payment.amountUSD)
        .divide(new bigDecimal(SchedulerService.klayPrice), 4)
        .getValue(),
    );
    payment.plan = plan;
    payment.user = user;
    return payment;
  }

  /**
   * Get new address and bind it to payment
   * @param paymentId
   * @returns 
   */
  public async getAddress(paymentId: string): Promise<Account> {
    return new Promise<Account>(async (resolve, reject) => {
      const payment = await this.paymentRepository.findOne({ paymentId }, {
        relations: ['account']
      });

      if (!payment)
        return reject(new HttpException(ResponseMessage.INVALID_PAYMENT_ID, ResponseCode.BAD_REQUEST));

      switch (payment.status) {
        case PaymentStatus.CANCELLED:
          reject(new HttpException(ResponseMessage.PAYMENT_ALREADY_CANCELLED, ResponseCode.BAD_REQUEST));
          break;

        case PaymentStatus.COMPLETED:
          reject(new HttpException(ResponseMessage.PAYMENT_ALREADY_PAID, ResponseCode.BAD_REQUEST));
          break;

        case PaymentStatus.PENDING:
          try {
            const account = await this.generateAddressAndBindToPayment(payment);
            resolve(account)
          }
          catch (err) {
            reject();
          }
          break;
      }
      return;
    });
  }

  /**
   * Genereate a new address and bind to payment
   * @param payment 
   * @returns 
   */
  public async generateAddressAndBindToPayment(payment: Payment): Promise<Account> {
    return new Promise<Account>(async (resolve, reject) => {
      if (payment.account) {
        return resolve(payment.account);
      }
      else {
        // get a connection and create a new query runner
        const connection = getConnection();
        const queryRunner = connection.createQueryRunner();
        // establish real database connection using our new query runner
        await queryRunner.connect();
        // lets now open a new transaction:
        await queryRunner.startTransaction();
        try {
          const account = await this.octetService.getAccount();
          await this.paymentRepository.update({ paymentId: payment.paymentId }, { account });
          await queryRunner.commitTransaction();
          await queryRunner.release();
          return resolve(account);
        }
        catch (err) {
          await queryRunner.rollbackTransaction();
          await queryRunner.release();
          reject(err);
        }
      }
    });
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: JOB.EXPIRE_PAYMENT,
  })
  public async expirePayment(): Promise<number> {
    try {
      this.loggerServce.log(`Payment Expiry Job started at: ${moment().unix()}`);
      const now = moment().unix();
      const records = await this.paymentRepository.find({
        where: {
          status: PaymentStatus.PENDING,
          expireAt: LessThanOrEqual(now)
        },
        relations: ['account']
      });

      await Promise.all(records.map(async m => {
        await this.octetService.freeAccount(m.account);
        m.status = PaymentStatus.CANCELLED;
        m.account = null;
        await this.paymentRepository.save(m);
      }))
        .then(() => {
          this.loggerServce.log(`Payment Expiry Job Completed at: ${moment().unix()}`);
        });
      return;
    }
    catch (err) {
      this.loggerServce.log(`Payment Expiry Job Failed`);
      return;
    }
  }

  /**
   * Paginate the payment list
   * @param options
   * @param condition
   * @param relations
   * @returns
   */
  private async paginate(
    options: IPaginationOptions,
    condition?: Object,
    relations?: string[],
  ): Promise<Pagination<Payment>> {
    return paginate<Payment>(this.paymentRepository, options, {
      order: { createdAt: 'DESC' },
      where: condition,
      relations: relations,
    });
  }
}
