import { binance } from 'ccxt';
import { HttpException, Injectable } from '@nestjs/common';
import { ResponseCode, ResponseMessage } from '../../utils/enum';

@Injectable()
export class BinanceService {
  constructor(private binanceExchannge: binance) {
    this.binanceExchannge = new binance();
  }
  /**
   * Verify The Binance Api Key Given By User
   * @param apiKey
   * @param secret
   * @returns
   */
  public async verifyApiKey(apiKey: string, secret: string) {
    try {
      this.binanceExchannge = new binance({ apiKey, secret });
      await this.binanceExchannge.fetchBalance();
      return;
    } catch (err) {
      if (err.message.includes('-2008')) {
        throw new HttpException(
        ResponseMessage.INVALID_BINANCE_API,
        ResponseCode.BAD_REQUEST,
        )
      } else {
        throw new HttpException(
        ResponseMessage.INTERNAL_SERVER_ERROR,
        ResponseCode.INTERNAL_ERROR,
        )
      }
    }
  }
  /**
   * Get current Nano Price
   * @returns
   */
  public async getNanoPrice() {
    try {
      const price = await this.binanceExchannge.fetchTicker(`XNOUSDT`);
      return price.info.lastPrice;
    } catch (err) {
      throw new HttpException(
        ResponseMessage.INTERNAL_SERVER_ERROR,
        ResponseCode.INTERNAL_ERROR,
      );
    }
  }
}
