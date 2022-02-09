import { Injectable } from '@nestjs/common';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { dropDatabase, createDatabase } from 'typeorm-extension';
import { NodeEnv } from '../../utils/enum';

@Injectable()
export class AppService {
  constructor() {}

  root(): string {
    return process.env.APP_URL;
  }

  static envConfiguration(): string {
    switch (process.env.NODE_ENV) {
      case NodeEnv.TEST:
        return `_${NodeEnv.TEST}.env`;

      default:
        return `.env`;
    }
  }

  static async createConnection() {
    await createDatabase(
      { ifNotExist: true },
      {
        type: 'mysql',
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
}
