import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SeedService } from '../../modules/seed/seed.service';
import { getConnection, Repository, LessThanOrEqual, Like } from 'typeorm';
import {
  BonusType,
  CryptoAsset,
  PaymentStatus,
  PaymentType,
} from './commons/payment.enum';
import { Payment } from './payment.entity';
import moment from 'moment';
import { PriceService } from '../price/price.service';
import bigDecimal from 'js-big-decimal';
import ShortUniqueId from 'short-unique-id';
import { User } from '../user/user.entity';
import {
  paginate,
  Pagination,
  IPaginationOptions,
} from 'nestjs-typeorm-paginate';
import { ResponseCode, ResponseMessage, Time } from '../../utils/enum';
import { KlaytnService } from '../klaytn/klaytn.service';
import { Account } from '../klaytn/account.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JOB } from '../../utils/enum/index';
import { LoggerService } from '../../utils/logger/logger.service';
import { Deposit } from './deposit.entity';
import { CompensationTransaction } from './compensation.transaction';
import { DepositCompletedEvent } from '../scheduler/deposit.complete.event';
import { UsersService } from '../../modules/user';
import { Bot } from '../../modules/bot/bot.entity';
import { SocketService } from './../socket/socket.service';
import { Notifications } from '../../modules/socket/commons/socket.enum';
import { PDFGenerator } from './pdf.generator';
import { PDF } from './commons/payment.types';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
    private readonly compensationTransaction: CompensationTransaction,
    private readonly seedService: SeedService,
    private readonly klaytnService: KlaytnService,
    private readonly loggerServce: LoggerService,
    private readonly userService: UsersService,
    private readonly socketService: SocketService,
    private readonly pdfGenerator: PDFGenerator,
  ) {}

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
    payment.type = PaymentType.ACTIVATION + '-' + plan.planName;
    payment.amountUSD = plan.price;
    payment.status = PaymentStatus.PENDING;
    payment.createdAt = moment().unix();
    payment.expireAt = payment.createdAt + Time.ONE_HOUR; // 1 hour after creation
    payment.amountKLAY = Number(
      new bigDecimal(payment.amountUSD)
        .divide(new bigDecimal(PriceService.klayPrice), 4)
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
      const payment = await this.paymentRepository.findOne(
        { paymentId },
        {
          relations: ['account'],
        },
      );
      if (!payment)
        return reject(
          new HttpException(
            ResponseMessage.INVALID_PAYMENT_ID,
            ResponseCode.BAD_REQUEST,
          ),
        );

      switch (payment.status) {
        case PaymentStatus.CANCELLED:
          reject(
            new HttpException(
              ResponseMessage.PAYMENT_ALREADY_CANCELLED,
              ResponseCode.BAD_REQUEST,
            ),
          );
          break;

        case PaymentStatus.COMPLETED:
          reject(
            new HttpException(
              ResponseMessage.PAYMENT_ALREADY_PAID,
              ResponseCode.BAD_REQUEST,
            ),
          );
          break;

        case PaymentStatus.PENDING:
          try {
            const account = await this.generateAddressAndBindToPayment(payment);
            resolve(account);
          } catch (err) {
            console.log(err);
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
  public async generateAddressAndBindToPayment(
    payment: Payment,
  ): Promise<Account> {
    return new Promise<Account>(async (resolve, reject) => {
      if (payment.account) {
        return resolve(payment.account);
      } else {
        // get a connection and create a new query runner
        const connection = getConnection();
        const queryRunner = connection.createQueryRunner();
        // establish real database connection using our new query runner
        await queryRunner.connect();
        // lets now open a new transaction:
        await queryRunner.startTransaction();
        try {
          const account = await this.klaytnService.getAccount(queryRunner);
          payment.account = account;
          await queryRunner.manager.save(payment);
          await queryRunner.commitTransaction();
          await queryRunner.release();
          return resolve(account);
        } catch (err) {
          console.log('Error logs:', err);
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
      this.loggerServce.log(
        `Payment Expiry Job started at: ${moment().unix()}`,
      );
      const now = moment().unix();
      const records = await this.paymentRepository.find({
        where: {
          status: PaymentStatus.PENDING,
          expireAt: LessThanOrEqual(now),
        },
        relations: ['account'],
      });

      await Promise.all(
        records.map(async (m) => {
          if (m.account) {
            await this.klaytnService.freeAccount(m.account);
            m.account = null;
          }
          m.status = PaymentStatus.CANCELLED;
          await this.paymentRepository.save(m);
        }),
      ).then(() => {
        this.loggerServce.log(
          `Payment Expiry Job Completed at: ${moment().unix()}`,
        );
      });
      return;
    } catch (err) {
      this.loggerServce.log(`Payment Expiry Job Failed`);
      return;
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES, {
    name: JOB.PROCESS_DEPOSIT,
  })
  public async processDeposit(): Promise<number> {
    try {
      this.loggerServce.log(
        `Process Deposit Job started at: ${moment().unix()}`,
      );
      const deposits = await this.depositRepository.find({
        where: {
          processed: false,
        },
        relations: ['payment', 'payment.user'],
      });

      await Promise.all(
        deposits.map(async (d) => {
          const depositEvent = new DepositCompletedEvent();
          depositEvent.bonusType = BonusType.LISENCE;
          depositEvent.deposit = d;
          depositEvent.user = d.payment.user;
          await this.compensationTransaction.initCompensationTransaction(
            depositEvent,
          );
        }),
      ).then(() => {
        this.loggerServce.log(
          `Process Deposit Job Completed at: ${moment().unix()}`,
        );
      });
      return;
    } catch (err) {
      this.loggerServce.log(`Process Deposit Job Failed`);
      return;
    }
  }

  /**
   * Notify the user for preformance fee payment dues
   * @returns
   */
  @Cron(CronExpression.EVERY_MINUTE, {
    name: JOB.NOTIFY_PROFIT_LIMIT_EXCEED,
  })
  public async NotifyUsersOnProfitLimitReach() {
    this.loggerServce.log(
      `JOB: Notify user on profit limit reach started at: ${moment().unix()}`,
    );
    const activeTraders = await this.userService.getActiveTraders();
    Promise.all(
      activeTraders.map(async (m) => {
        const valid = await this.userService.validateActiveTradersProfit(m);
        if (valid) {
          await this.socketService.emitNotification(
            m.email,
            Notifications.PERFORMANCE_FEE,
          );
          this.loggerServce.debug(
            `JOB: Notify user on profit limit reach: ${m.userName}`,
          );
        }
      }),
    ).then(() => {
      this.loggerServce.log(
        `JOB: Notify user on profit limit reach completed at: ${moment().unix()}`,
      );
      return;
    });
  }

  /**
   * Notify the user for preformance fee payment dues
   * @returns
   */
  @Cron(CronExpression.EVERY_MINUTE, {
    name: JOB.NOTIFY_TRADE_LIMIT_EXCEED,
  })
  public async NotifyUsersOnTradeLimitExceed() {
    this.loggerServce.log(
      `JOB: Notify user on trade limit exceed started at: ${moment().unix()}`,
    );

    const users = await this.userService.validateTradeTimeStamp();
    if (!users.length) {
      this.loggerServce.log(
        `JOB: Notify user on trade limit exceed completed at: ${moment().unix()}`,
      );
      return;
    } else {
      Promise.all(
        users.map(async (m) => {
          try {
            await this.socketService.emitNotification(
              m.email,
              Notifications.PERFORMANCE_FEE,
            );
            this.loggerServce.debug(
              `JOB: Notify user on trade limit exceed: ${m.userName}`,
            );
          } catch (err) {
            this.loggerServce.error(err);
          }
        }),
      ).then(() => {
        this.loggerServce.log(
          `JOB: Notify user on trade limit exceed completed at: ${moment().unix()}`,
        );
        return;
      });
    }
  }

  /**
   * Create Preformance fee payment
   * @returns
   */
  public async createPreformanceFeePayment(user: User): Promise<Payment[]> {
    return new Promise<Payment[]>(async (resolve, reject) => {
      let payments: Payment[] = [];
      const bots = await this.userService.getBotsByUserId(user);
      await Promise.all(
        bots.map(async (m) => {
          try {
            const payment = await this.buildPayment(user, m);
            payment ? payments.push(payment) : '';
          } catch (err) {
            reject(err);
          }
        }),
      );
      return resolve(payments);
    });
  }

  /**
   * Build preformace fee payment for the given user and bot
   * @param options
   * @param condition
   * @param relations
   * @returns
   */
  public async buildPayment(user: User, bot: Bot): Promise<Payment | void> {
    return new Promise<Payment | void>(async (resolve, reject) => {
      try {
        const profit = await this.userService.getBotProfit(
          bot.botid,
          user.tradeStartDate,
          user.tradeExpiryDate,
        );
        if (!profit) {
          this.loggerServce.warn(`Profits not found for bot: ${bot.botid}`);
          resolve();
        } else {
          const tradesList = await this.userService.getTradesBetweenRange(
            bot.botid,
            user.tradeStartDate,
            user.tradeExpiryDate,
          );
          const uid = new ShortUniqueId({ length: 10 });
          const payment = new Payment();
          payment.paymentId = uid();
          if (bot.baseasset === CryptoAsset.USDT) {
            payment.type = PaymentType.TX_PREFORMANCE_USDT;
            payment.amountUSD = Number(
              new bigDecimal(profit)
                .multiply(new bigDecimal(user.plan.preformanceFeePercentage))
                .divide(new bigDecimal(100), 4)
                .getValue(),
            );
          } else {
            payment.type = PaymentType.TX_PREFORMANCE_BTC;
            let profitInUsd = new bigDecimal(PriceService.btcPrice).multiply(
              new bigDecimal(profit),
            );
            payment.amountUSD = Number(
              profitInUsd
                .multiply(new bigDecimal(user.plan.preformanceFeePercentage))
                .divide(new bigDecimal(100), 4)
                .getValue(),
            );
          }
          payment.status = PaymentStatus.PENDING;
          payment.createdAt = moment().unix();
          payment.expireAt = payment.createdAt + Time.ONE_HOUR; //1 Hour after the payment creation
          payment.amountKLAY = Number(
            new bigDecimal(payment.amountUSD)
              .divide(new bigDecimal(PriceService.klayPrice), 4)
              .getValue(),
          );
          payment.plan = user.plan;
          payment.user = user;
          let data: PDF = {
            userName: user.userName,
            from: moment(user.tradeStartDate * 1000).format(
              'MM-DD-YYYY HH:mm:ss',
            ),
            to: moment(user.tradeExpiryDate * 1000).format(
              'MM-DD-YYYY HH:mm:ss',
            ),
            issueDate: moment().format('MM-DD-YYYY HH:mm:ss'),
            profit: profit,
            charges: payment.amountUSD,
            preformanceFee: user.plan.preformanceFeePercentage,
            trades: tradesList,
          };
          payment.pdf = await this.pdfGenerator.generatePDF(data);
          this.loggerServce.log(
            `Payment created = ${payment.paymentId}, bot: ${bot.botid}`,
          );
          resolve(await this.paymentRepository.save(payment));
        }
      } catch (err) {
        this.loggerServce.error(`Preformance Fee payment creation failed !`);
        reject(err);
      }
    });
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
