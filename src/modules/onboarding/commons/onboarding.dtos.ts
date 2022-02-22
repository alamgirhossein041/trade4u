import { IsNotEmpty, IsString } from 'class-validator';

export class BinanceKeysDto {
  @IsNotEmpty()
  @IsString()
  public apiKey: string;

  @IsNotEmpty()
  @IsString()
  public apiSecret: string;
}
