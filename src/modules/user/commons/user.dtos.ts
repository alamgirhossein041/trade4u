import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { TradingSystem } from "./user.enums";

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