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
  public directBonusPercentage: number;

  @IsPositive()
  public performanceBonusPercentage: number;

  @IsPositive()
  public minimumUSDT: number;

  @IsPositive()
  public minimumBTC: number;
}
