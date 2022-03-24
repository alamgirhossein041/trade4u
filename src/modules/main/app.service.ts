import { Injectable } from '@nestjs/common';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { SeedService } from '../../modules/seed/seed.service';
import { createDatabase } from 'typeorm-extension';
import { NodeEnv } from '../../utils/enum';
import { TelegramService } from '../../utils/telegram/telegram-bot.service';

@Injectable()
export class AppService {
  constructor(
  ) {
  }

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
    try {
      await SeedService.InsertSeed();
      !(process.env.NODE_ENV === NodeEnv.TEST) ? await TelegramService.initBotWebhook() : '';
      return;
    }
    catch (err) {
      console.log(err);
    }
  }
}
