import { Connection, EntitySubscriberInterface, ObjectLiteral, UpdateEvent } from 'typeorm';
import { InjectConnection } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../user/user.service';
import { UserStats } from '../../user/user-stats.entity';
import { User } from '../../user/user.entity';
import bigDecimal from 'js-big-decimal';
import { TelegramService } from '../../../utils/telegram/telegram-bot.service';

@Injectable()
export class UserStatsSubscriber implements EntitySubscriberInterface<UserStats> {

    /**
  * Check whether the consumption percentage of parent does not exceed defined limit
  * @param user
  * @param userStats
  */
    private async checkParentConsumedPercentage(user: User, userStats: ObjectLiteral) {
        if(!user.refereeUuid) return false;
        const amountToMultiplyWith = Number(
            new bigDecimal(userStats.consumed_amount)
                .divide(new bigDecimal(userStats.earning_limit), 4)
                .getValue(),
        );
        const originalPercentage = Number(
            new bigDecimal(amountToMultiplyWith)
                .multiply(new bigDecimal(100))
                .getValue(),
        );
        if (originalPercentage < 90) {
            return false;
        } else if (originalPercentage >= 90 && originalPercentage < 95) {
            if (user.userTelegram && user.userTelegram.isActive) {
                const parentTelegram = user.userTelegram;
                if (parentTelegram.systemNotificationsActive) {
                    let message = `Hi ${parentTelegram.name}!
                \nYour Plan Limit is About To End.
                \nPlease Update Your Plan To Continue Trading With Binance Plus.
                \nThanks
                \nBinancePlus Team`;
                    // await this.telegramService.sendSystemNotifications(
                    //     parentTelegram,
                    //     message,
                    // );
                }
            }
            return false;
        } else if (originalPercentage >= 95) {
            return true;
        }
    }


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

    /**
     * After Update Event of user stats
     * @param event 
     * @returns 
     */
    public async afterUpdate(event: UpdateEvent<UserStats>): Promise<any> {
        const user = await this.userService.getByUserStats(event.databaseEntity);
        const isEarningLimitReached = await this.checkParentConsumedPercentage(user, event.entity);
        if(isEarningLimitReached) {
            const bot = await this.userService.getBotByUserId(user);
            if(bot) {
                await this.userService.stopUserBot(bot.botid);
            }
        }
    }
}
