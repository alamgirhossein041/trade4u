import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedModule } from '../../modules/seed/seed.module';
import { UserContoller } from './user.contoller';
import { UserStats } from './user-stats.entity';
import { User } from './user.entity';
import { UsersService } from './user.service';
import { LicenseFee } from '../seed/licensefee.entity';
import { LoggerModule } from '../../utils/logger/logger.module';
import { BinanceModule } from '../../utils/binance/binance.module';
import { TelegramModule } from '../../utils/telegram/telegram-bot.module';
import { UserTelegram } from './telegram.entity';
import { MailModule } from '../../utils/mailer/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserStats, LicenseFee, UserTelegram]),
    SeedModule,
    LoggerModule,
    TelegramModule,
    BinanceModule,
    BinanceModule,
    MailModule,
  ],
  exports: [UsersService],
  providers: [UsersService],
  controllers: [UserContoller],
})
export class UserModule {}
