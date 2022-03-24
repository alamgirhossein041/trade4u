import { Module } from '@nestjs/common';
import { KlaytnService } from './klaytn.service';
import { KlaytnController } from './klaytn.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { LoggerModule } from '../../utils/logger/logger.module';
import { BullModule } from '@nestjs/bull';
import { BlockQueue } from '../scheduler/commons/scheduler.enum';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
    LoggerModule,
    BullModule.registerQueueAsync({
      name: BlockQueue.BLOCK
    }),
  ],
  controllers: [KlaytnController],
  providers: [KlaytnService],
  exports: [KlaytnService],
})
export class KlaytnModule { }
