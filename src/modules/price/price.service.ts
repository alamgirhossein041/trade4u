import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../utils/logger/logger.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CoinGeckoMarket } from './coingecko.service';
import { ResponseMessage } from '../../utils/enum';
import { JOB } from '../../utils/enum/index';
import { Price } from './price.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment';
import { CryptoAsset } from '../../modules/payment/commons/payment.enum';

@Injectable()
export class PriceService {
  static klayPrice: number;
  static btcPrice: number;

  constructor(
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    private readonly loggerService: LoggerService,
    private readonly coinGeckoService: CoinGeckoMarket,
  ) {
    this.loggerService.setContext('PriceService');
    (async () => {
        await this.initKlayPrice();
        await this.initBtcPrice();
    })();
  }

  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: JOB.KLAY_MARKET_PRICE,
  })
  public async getMarketPrice() {
    const ping = await this.coinGeckoService.ping();
    if (!ping) {
      this.loggerService.error(ResponseMessage.UNABLE_TO_PING_COINMARKET);
      return;
    }
    const [klay, btc] = await Promise.all([
      this.coinGeckoService.getPrice('klay-token'),
      this.coinGeckoService.getPrice('bitcoin')
    ]);
    const [klayPrice, btcPrice] = await Promise.all([
      this.saveKlayPrice(klay),
      this.saveBtcPrice(btc)
    ]);
    return { klayPrice, btcPrice };
  }

  /**
   * Save latest price
   * @param marketCap
   * @returns
   */
  public async saveKlayPrice(marketCap): Promise<number> {
    const newPrice = new Price();
    marketCap = marketCap['klay-token'];
    newPrice.price = marketCap.usd;
    newPrice.timestamp = marketCap.last_updated_at;
    newPrice.currency = CryptoAsset.KLAY;
    this.loggerService.log(`Get klay latest price at ${moment().unix()}`);
    await this.priceRepository.save(newPrice);
    return marketCap.usd;
  }

  /**
   * Save latest price
   * @param marketCap
   * @returns
   */
  public async saveBtcPrice(marketCap): Promise<number> {
    const newPrice = new Price();
    marketCap = marketCap.bitcoin;
    newPrice.price = marketCap.usd;
    newPrice.timestamp = marketCap.last_updated_at;
    newPrice.currency = CryptoAsset.BTC;
    this.loggerService.log(`Get BTC latest price at ${moment().unix()}`);
    await this.priceRepository.save(newPrice);
    return marketCap.usd;
  }

  /**
   * Initailize klay price on startup
   */
  public async initKlayPrice() {
    const result: any[] = await this.priceRepository.query(`SELECT 
                    price 
                FROM 
                    prices 
                WHERE 
                    timestamp = (SELECT MAX(timestamp) FROM prices WHERE currency = '${CryptoAsset.KLAY}');`);

    if (!result.length) {
      this.loggerService.log(`Get klay latest price on startup`);
      const data = await this.getMarketPrice();
      PriceService.klayPrice = data.klayPrice;
    } else {
      PriceService.klayPrice = result[0].price;
    }
    return;
  }

  /**
   * Initailize klay price on startup
   */
  public async initBtcPrice() {
    const result: any[] = await this.priceRepository.query(`SELECT 
                    price 
                FROM 
                    prices 
                WHERE 
                    timestamp = (SELECT MAX(timestamp) FROM prices WHERE currency = '${CryptoAsset.BTC}');`);

    if (!result.length) {
      this.loggerService.log(`Get Btc latest price on startup`);
      const data = await this.getMarketPrice();
      PriceService.btcPrice = data.btcPrice;
      } else {
      PriceService.btcPrice = result[0].price;
    }
    return;
  }
}
