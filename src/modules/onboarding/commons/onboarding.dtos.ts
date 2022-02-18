import { IsNotEmpty, IsString } from 'class-validator';

export class BinanceApiCredsDto {
  @IsNotEmpty()
  @IsString()
  public apiKey: string;

  @IsNotEmpty()
  @IsString()
  public secret: string;
}
