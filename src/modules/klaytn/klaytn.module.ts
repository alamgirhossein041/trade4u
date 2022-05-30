import { Module } from '@nestjs/common';
import { KlaytnService } from './klaytn.service';
import { KlaytnController } from './klaytn.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { LoggerModule } from '../../utils/logger/logger.module';
import { BullModule } from '@nestjs/bull';
import { BlockQueue } from '../scheduler/commons/scheduler.enum';
import { Information } from './information.entity';
import { CaverService } from './caver.service';
import { GcpSecretModule } from '../../utils/secret-manager/gcp.sm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Information]),
    LoggerModule,
    BullModule.registerQueueAsync({
      name: BlockQueue.BLOCK,
    }),
    GcpSecretModule
  ],
  controllers: [KlaytnController],
  providers: [KlaytnService, CaverService],
  exports: [KlaytnService, CaverService],
})
export class KlaytnModule {}
