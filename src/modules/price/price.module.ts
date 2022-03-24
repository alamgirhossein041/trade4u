import { Module } from '@nestjs/common';
import { PriceService } from './price.service';
import { PriceController } from './price.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Price } from './price.entity';
import { LoggerModule } from '../../utils/logger/logger.module';
import { CoinGeckoMarket } from './coingecko.service';

@Module({
  imports: [TypeOrmModule.forFeature([Price]), LoggerModule],
  controllers: [PriceController],
  providers: [PriceService, CoinGeckoMarket],
  exports: [PriceService, CoinGeckoMarket],
})
export class PriceModule {}
