import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { LoggerModule } from '../../utils/logger/logger.module';
import { PaymentModule } from '../../modules/payment/payment.module';
import { BlockProcessor } from './block.processor';
import { KlaytnModule } from '../../modules/klaytn/klaytn.module';
import { EventEmitter } from './event.emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deposit } from '../payment/deposit.entity';
import { SocketModule } from '../../modules/socket/socket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deposit]),
    LoggerModule,
    PaymentModule,
    KlaytnModule,
    SocketModule,
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService, BlockProcessor, EventEmitter],
  exports: [SchedulerService, BlockProcessor, EventEmitter],
})
export class SchedulerModule {}
