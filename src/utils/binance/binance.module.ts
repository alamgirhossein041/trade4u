import { Module } from '@nestjs/common';
import { BinanceService } from './binance.service';
import { binance } from 'ccxt';

@Module({
  imports: [],
  providers: [BinanceService, binance],
  exports: [BinanceService],
})
export class BinanceModule {}
