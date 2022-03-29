import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from '../../modules/user';
import { SeedModule } from '../../modules/seed/seed.module';
import { KlaytnModule } from '../klaytn/klaytn.module';
import { PaymentModule } from '../../modules/payment/payment.module';
import { PriceModule } from '../price/price.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from '../../utils/logger/logger.module';
import { BullModule } from '@nestjs/bull';
import { SchedulerModule } from '../../modules/scheduler/scheduler.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async () => {
        return await AppService.createConnection();
      },
    }),
    ConfigModule.forRoot({
      envFilePath: [AppService.envConfiguration()],
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    CommonModule,
    UserModule,
    KlaytnModule,
    LoggerModule,
    SeedModule,
    PaymentModule,
    PriceModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
