import { getConnection, QueryRunner, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '../user/user.entity';
import { UsersService } from '../user/user.service';
import { LicenseFee } from '../seed/licensefee.entity';
import { PlanNameEnum } from '../seed/seed.enums';
import bigDecimal from 'js-big-decimal';
import { PerformanceFee } from '../seed/preformaceFee.entity';
import { BonusType } from './commons/payment.enum';

@Injectable()
export class CompensationTransaction {
  /**
   *
   * @param licenseRepository
   * @param performanceRepository
   * @param userRepository
   * @param userService
   */
  constructor(
    @InjectRepository(LicenseFee)
    private readonly licenseRepository: Repository<LicenseFee>,
    @InjectRepository(PerformanceFee)
    private readonly performanceRepository: Repository<PerformanceFee>,
    private readonly userService: UsersService,
  ) {}

  /**
   * Distribute License Bonus Among Parents Of User
   * @param user
   * @returns
   */
  public async initCompensationTransaction(user: User, bonusType: string) {
    return new Promise<void>(async (resolve, reject) => {
      // get a connection and create a new query runner
      const connection = getConnection();
      const queryRunner = connection.createQueryRunner();
      // establish real database connection using our new query runner
      await queryRunner.connect();
      // lets now open a new transaction:
      await queryRunner.startTransaction();
      try {
        const userWithPlan = await this.userService.get(user.uuid);
        const planAmount = userWithPlan.plan.price;
        const userParentTree = await this.userService.getUserParentsTree(
          userWithPlan,
        );
        await this.distBonusInParents(
          userParentTree,
          planAmount,
          bonusType,
          queryRunner,
        );
        await queryRunner.commitTransaction();
      } catch (err) {
        // since we have errors let's rollback changes we made
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        reject(err);
      } finally {
        // you need to release query runner which is manually created:
        await queryRunner.release();
        resolve();
      }
    });
  }

  /**
   * Distribute Bonus Percentage Among Parents according to their plan
   * @param parenTree
   * @param planAmount
   * @returns
   */
  private async distBonusInParents(
    parenTree: any,
    planAmount: number,
    bonusType: string,
    queryRunner: QueryRunner,
  ) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        parenTree.map(async (parent: any) => {
          const bonusPercentage = await this.getBonusPercentage(
            bonusType,
            parent.plan_name,
            parent.level,
          );
          let amount = this.getBonusAmount(bonusPercentage, planAmount);
          amount += parent.balance;
          const parentToUpdate = await this.userService.getByUserName(
            parent.userName,
          );
          parentToUpdate.balance = amount;
          await queryRunner.manager.save(parentToUpdate);
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Get License Bonus Percentage of Plan For Specific Level
   * @param planName
   * @param level
   */
  private async getBonusPercentage(
    bonusType: string,
    planName: string,
    level: number,
  ) {
    let percentage: number;
    let repository: Repository<LicenseFee | PerformanceFee>;
    if (bonusType === BonusType.PERFORMANCE)
      repository = this.performanceRepository;
    else repository = this.licenseRepository;
    let row: LicenseFee | PerformanceFee;
    switch (planName) {
      case PlanNameEnum.Silver:
        row = await repository.findOne({ levelNo: level });
        percentage = row.silverPercentage;
        break;
      case PlanNameEnum.Gold:
        row = await repository.findOne({ levelNo: level });
        percentage = row.goldPercentage;
        break;
      case PlanNameEnum.Platinum:
        row = await repository.findOne({ levelNo: level });
        percentage = row.platinumPercentage;
        break;
      case PlanNameEnum.Premium:
        row = await repository.findOne({ levelNo: level });
        percentage = row.premiumPercentage;
        break;
    }
    return percentage;
  }

  /**
   * Get License Bonus Amount of User
   * @param percentage
   * @param amount
   */
  private getBonusAmount(percentage: number, amount: number) {
    const amountToMultiplyWith = Number(
      new bigDecimal(percentage).divide(new bigDecimal(100), 4).getValue(),
    );
    const originalAmount = Number(
      new bigDecimal(amountToMultiplyWith)
        .multiply(new bigDecimal(amount))
        .getValue(),
    );
    return originalAmount;
  }
}
