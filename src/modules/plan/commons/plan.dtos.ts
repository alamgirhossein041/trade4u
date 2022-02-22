import { IsEnum, IsPositive } from 'class-validator';
import { EarningLimitEnum, PlanNameEnum } from './plan.enums';

export class BasePlanDto {
  @IsEnum(PlanNameEnum)
  public planName: string;

  @IsPositive()
  public price: number;

  @IsPositive()
  public levels: number;

  @IsEnum(EarningLimitEnum)
  public earningLimit: string;

  @IsPositive()
  public minUSDT: number;

  @IsPositive()
  public minBTC: number;
}
