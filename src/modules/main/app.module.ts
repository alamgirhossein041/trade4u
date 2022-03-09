import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from '../../modules/user';
import { SeedModule } from '../../modules/seed/seed.module';
import { OctetModule } from '../../modules/octet/octet.module';
import { PaymentModule } from '../../modules/payment/payment.module';
import { SchedulerModule } from '../../modules/scheduler/scheduler.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from '../../utils/logger/logger.module';

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
    ScheduleModule.forRoot(),
    AuthModule,
    CommonModule,
    UserModule,
    OctetModule,
    LoggerModule,
    SeedModule,
    PaymentModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
