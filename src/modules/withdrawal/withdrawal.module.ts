import { Module } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { WithdrawalController } from './withdrawal.controller';
import { UserModule } from '../../modules/user';
import { PriceModule } from '../../modules/price/price.module';
import { KlaytnModule } from '../../modules/klaytn/klaytn.module';
import { LoggerModule } from '../../utils/logger/logger.module';

@Module({
  controllers: [WithdrawalController],
  providers: [WithdrawalService],
  imports: [
    UserModule,
    PriceModule,
    KlaytnModule,
    LoggerModule
  ]
})
export class WithdrawalModule {}
