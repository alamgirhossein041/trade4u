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
import { Deposit } from './deposit.entity';
import { OctetModule } from '../octet/octet.module';
import { UserModule } from '../user/user.module';
import { CompensationTransaction } from './compensation.transaction';
import { LicenseFee } from '../seed/licensefee.entity';
import { PerformanceFee } from '../seed/preformaceFee.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Account, User, Deposit,LicenseFee,PerformanceFee]),
    SeedModule,
    LoggerModule,
    OctetModule,
    UserModule
  ],
  controllers: [PaymentController],
  providers: [PaymentService, DepositTransaction,CompensationTransaction],
  exports: [PaymentService, DepositTransaction,CompensationTransaction],
})
export class PaymentModule {}
