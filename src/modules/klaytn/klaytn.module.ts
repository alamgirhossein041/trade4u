import { Module } from '@nestjs/common';
import { KlaytnService } from './klaytn.service';
import { KlaytnController } from './klaytn.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { LoggerModule } from '../../utils/logger/logger.module';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), LoggerModule],
  controllers: [KlaytnController],
  providers: [KlaytnService],
  exports: [KlaytnService],
})
export class KlaytnModule {}
