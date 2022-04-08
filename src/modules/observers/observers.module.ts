import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { UserStatsSubscriber } from './subscribers/user-stats.subscriber';
import { TelegramModule } from '../../utils/telegram/telegram-bot.module';

@Module({
    imports: [
        UserModule,
        TelegramModule
    ],
    providers: [
        UserStatsSubscriber
    ],
    controllers: [],
    exports: []
})
export class ObserverModule {
}
