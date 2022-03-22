import { Injectable } from '@nestjs/common';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { SeedService } from '../../modules/seed/seed.service';
import { dropDatabase, createDatabase } from 'typeorm-extension';
import { NodeEnv, ResponseMessage } from '../../utils/enum';
import { Cron, SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { LoggerService } from '../../utils/logger/logger.service';
import { JOB } from '../scheduler/commons/scheduler.enum';
import { PaymentService } from '../payment/payment.service';
import axios from 'axios';
import { KlaytnService } from '../../modules/klaytn/klaytn.service';

@Injectable()
export class AppService {
  private readonly botWebhookUrl =
    process.env.SERVER_URL + `/webhook/${process.env.BOT_TOKEN}`;
  constructor(
    private readonly loggerService: LoggerService,
    private readonly paymentService: PaymentService,
  ) {}

  root(): string {
    return process.env.APP_URL;
  }

  /**
   * Configures The App Environment
   * @returns
   */
  static envConfiguration(): string {
    switch (process.env.NODE_ENV) {
      case NodeEnv.TEST:
        return `_${NodeEnv.TEST}.env`;

      default:
        return `.env`;
    }
  }

  static async initBotWebhook() {
    try {
      await axios.get(`${process.env.TELEGRAM_BOT_API}/deleteWebhook`);
      const res = await axios.get(
        `${process.env.TELEGRAM_BOT_API}/setWebhook?url=${process.env.SERVER_URL}/api/user/webhook/${process.env.BOT_TOKEN}`,
      );
      console.log(res.data);
    } catch (err) {
      console.log(
        'Please Use VPN and Restart Server to Connect to Telegram Bot',
      );
    }
  }
  /**
   * Create Connection to Database on App Start
   * @returns
   */
  static async createConnection() {
    await createDatabase(
      { ifNotExist: true },
      {
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
      },
    );

    return {
      type: process.env.DB_TYPE,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + './../**/**.entity{.ts,.js}'],
      synchronize: process.env.DB_SYNC === 'true',
      extra: {
        connectionLimit: 5,
      },
      logging: false,
    } as TypeOrmModuleAsyncOptions;
  }

  /**
   * Insert Seed Data in Database
   * @returns
   */
  public static async startup() {
    return await SeedService.InsertSeed().catch((err) => {
      console.log(err);
    });
  }

  @Cron(CronExpression.EVERY_10_HOURS, {
    name: JOB.RECOVER_DEPOSIT,
  })
  public async recoverUnProcessedDeposits(): Promise<void> {
    // this.loggerService.warn(ResponseMessage.DEPOSIT_RECOVERY_PROCESS_STARTED);
    // await this.paymentService.initDepositRecoveryProcess().catch((err) => {
    //   this.loggerService.error(err);
    // });
  }
}
