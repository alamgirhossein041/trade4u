import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { LoggerModule } from '../../utils/logger/logger.module';
import { PaymentModule } from '../../modules/payment/payment.module';
import { BlockProcessor } from './block.processor';
import { KlaytnModule } from '../../modules/klaytn/klaytn.module';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  imports: [LoggerModule, PaymentModule, KlaytnModule],
  controllers: [SchedulerController],
  providers: [SchedulerService, BlockProcessor,EventEmitter2],
  exports: [SchedulerService, BlockProcessor,EventEmitter2],
})
export class SchedulerModule {}
