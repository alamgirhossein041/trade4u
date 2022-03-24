import { Module } from '@nestjs/common';
import { TelegramService } from './telegram-bot.service';

@Module({
  exports: [TelegramService],
  providers: [TelegramService],
})
export class TelegramModule {}
