import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { SeedModule } from '../../modules/seed/seed.module';
import { DepositTransaction } from './deposit.transaction';
import { Account } from '../octet/account.entity';
import { User } from '../user/user.entity';
import { LoggerModule } from '../../utils/logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Account, User]),
    SeedModule,
    LoggerModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, DepositTransaction],
})
export class PaymentModule {}
