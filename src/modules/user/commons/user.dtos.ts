import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsPositive,
  IsString,
} from 'class-validator';
import { TradingSystem } from './user.enums';

export class BinanceTradingDto {
  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @IsNotEmpty()
  @IsString()
  apiSecret: string;

  @IsEnum(TradingSystem)
  tradingSystem: string;
}

export class TelegramNotifyDto {
  @IsPositive()
  code: number;

  @IsBoolean()
  tradingNotifications: boolean;

  @IsBoolean()
  systemNotifications: boolean;

  @IsBoolean()
  bonusNotifications: boolean;

  @IsBoolean()
  promotionNotifications: boolean;
}
