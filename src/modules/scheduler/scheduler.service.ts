import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../utils/logger/logger.service';
import { Cron, SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { CoinGeckoMarket } from './coingecko.service';
import { ResponseMessage } from '../../utils/enum';
import { JOB } from './commons/scheduler.enum';
import { Price } from './price.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment';

@Injectable()
export class SchedulerService {
  static klayPrice: number;

  constructor(
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    private readonly loggerService: LoggerService,
    private readonly coinGeckoService: CoinGeckoMarket,
  ) {
    this.loggerService.setContext('SchedulerService');
    (async () => {
      await this.initKlayPrice()
    })();
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: JOB.MARKET_PRICE,
  })
  public async getKlaytnPrice(): Promise<number> {
    const ping = await this.coinGeckoService.ping();
    if (!ping) {
      this.loggerService.error(ResponseMessage.UNABLE_TO_PING_COINMARKET);
      return;
    }
    const marketCap = await this.coinGeckoService.getPrice();
    return await this.savePrice(marketCap);
  }

  /**
   * Save latest price
   * @param marketCap
   * @returns
   */
  public async savePrice(marketCap): Promise<number> {
    const newPrice = new Price();
    marketCap = marketCap['klay-token'];
    newPrice.price = marketCap.usd;
    newPrice.timestamp = marketCap.last_updated_at;
    this.loggerService.log(`Get klay latest price at ${moment().unix()}`);
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
                    price 
                WHERE 
                    timestamp = (SELECT MAX(timestamp) FROM price);`);
    if (!result.length) {
      this.loggerService.log(`Get klay latest price on startup`);
      SchedulerService.klayPrice = await this.getKlaytnPrice();
    } else {
      SchedulerService.klayPrice = result[0].price;
    }
    return;
  }
}
