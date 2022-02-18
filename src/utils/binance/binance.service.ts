import { binance } from 'ccxt';
import { HttpException, Injectable } from '@nestjs/common';
import { ResponseCode, ResponseMessage } from 'utils/enum';

@Injectable()
export class BinanceService {
  constructor(private binanceExchannge: binance) {
    this.binanceExchannge = new binance();
  }
  public async verifyApiKey(apiKey: string, secret: string) {
    try {
      this.binanceExchannge = new binance({ apiKey, secret });
      await this.binanceExchannge.fetchBalance();
      return;
    } catch (err) {
      throw new HttpException(
        ResponseMessage.INVALID_BINANCE_API,
        ResponseCode.BAD_REQUEST,
      );
    }
  }

  public async getNanoPrice() {
    try {
      const price = await this.binanceExchannge.fetchTicker(`XNOUSDT`);
      return price.info.lastPrice;
    } catch (err) {
      throw new HttpException(
        ResponseMessage.BINANCE_SERVER_ERROR,
        ResponseCode.INTERNAL_ERROR,
      );
    }
  }
}
