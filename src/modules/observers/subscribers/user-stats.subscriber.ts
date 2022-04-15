import {
  Connection,
  EntitySubscriberInterface,
  ObjectLiteral,
  UpdateEvent,
} from 'typeorm';
import { InjectConnection } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../user/user.service';
import { UserStats } from '../../user/user-stats.entity';
import { User } from '../../user/user.entity';
import bigDecimal from 'js-big-decimal';
import { TelegramService } from '../../../utils/telegram/telegram-bot.service';

@Injectable()
export class UserStatsSubscriber
  implements EntitySubscriberInterface<UserStats>
{
  /**
   * Constructor
   * @param connection
   * @param userService
   * @param telegramService
   */
  constructor(
    @InjectConnection() readonly connection: Connection,
    private readonly userService: UsersService,
    private readonly telegramService: TelegramService,
  ) {
    connection.subscribers.push(this);
  }

  /**
   * Entity Listening to Function
   * @returns
   */
  public listenTo(): any {
    return UserStats;
  }
}
