import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class DepositWebHook {
  @IsPositive()
  id: number;

  @IsNotEmpty()
  @IsString()
  coinSymbol: string;

  @IsNotEmpty()
  @IsString()
  fromAddress: string;

  @IsNotEmpty()
  @IsString()
  toAddress: string;

  @IsNotEmpty()
  @IsString()
  amount: string;

  @IsNotEmpty()
  @IsString()
  txid: string;

  @IsNumber()
  outputIndex: number;

  @IsNotEmpty()
  @IsString()
  data: string;

  @IsPositive()
  blockHeight: number;

  @IsNotEmpty()
  @IsString()
  dwDate: string;

  @IsNotEmpty()
  @IsString()
  dwModifiedDate: string;

  @IsNotEmpty()
  @IsString()
  type: string;
}
