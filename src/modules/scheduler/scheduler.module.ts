import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Price } from './price.entity';
import { LoggerModule } from '../../utils/logger/logger.module';
import { CoinGeckoMarket } from './coingecko.service';

@Module({
  imports: [TypeOrmModule.forFeature([Price]), LoggerModule],
  controllers: [SchedulerController],
  providers: [SchedulerService, CoinGeckoMarket],
  exports: [SchedulerService, CoinGeckoMarket],
})
export class SchedulerModule {}
