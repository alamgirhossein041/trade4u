import { binance } from 'ccxt';
import { HttpException, Injectable } from '@nestjs/common';
import { ResponseCode, ResponseMessage } from 'utils/enum';

@Injectable()
export class BinanceService {
  constructor() {}
  public async verifyApiKey(apiKey: string, secret: string) {
    try {
      const binanceInstance = new binance({ apiKey: apiKey, secret: secret });
      await binanceInstance.fetchBalance();
      return;
    } catch (err) {
      throw new HttpException(
        ResponseMessage.INVALID_BINANCE_API,
        ResponseCode.BAD_REQUEST,
      );
    }
  }
}
