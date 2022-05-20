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
    this.binanceExchannge = new binance({
      apiKey,
      secret
    });
    this.binanceExchannge.setSandboxMode(true);
    try {
      this.binanceExchannge.checkRequiredCredentials(); // throw AuthenticationError
      await this.binanceExchannge.fetchBalance();
    } catch (error) {
      if (
        error.message.includes('-2014') ||
        error.message.includes('-2015') ||
        error.message.includes('-1022')
      ) {
        throw new HttpException(
          ResponseMessage.INVALID_BINANCE_CREDENTIALS,
          ResponseCode.BAD_REQUEST,
        );
      } else {
        throw new HttpException(
          ResponseMessage.INTERNAL_SERVER_ERROR,
          ResponseCode.INTERNAL_ERROR,
        );
      }
    }
  }
}
