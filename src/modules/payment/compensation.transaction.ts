import { getConnection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { User } from './../user/user.entity';
import { UsersService } from './../user/user.service';
import { LicenseFee } from '../seed/licensefee.entity';
import { PlanNameEnum } from '../seed/seed.enums';

@Injectable()
export class CompensationTransaction {
  /**
   *
   * @param licenseRepository
   * @param userRepository
   * @param userService
   */
  constructor(
    @InjectRepository(LicenseFee)
    private readonly licenseRepository: Repository<LicenseFee>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UsersService,
  ) {}

  /**
   * Distribute License Bonus Among Parents Of User
   * @param user
   * @returns
   */
  public async initCompensationPlan(user: User) {
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
        await this.distBonusInParents(userParentTree, planAmount);
        await queryRunner.commitTransaction();
      } catch (err) {
        // since we have errors let's rollback changes we made
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return reject();
      } finally {
        // you need to release query runner which is manually created:
        await queryRunner.release();
        return resolve();
      }
    });
  }

  /**
   * Distribute Bonus Percentage Among Parents according to their plan
   * @param parenTree
   * @param planAmount
   * @returns
   */
  private async distBonusInParents(parenTree: any, planAmount: number) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        parenTree.map(async (parent: any) => {
          const bonusPercentage = await this.getBonusPercentage(
            parent.plan_name,
            parent.level,
          );
          let amount = this.getBonusAmount(bonusPercentage, planAmount);
          amount += parent.balance;
          await this.userRepository.update(
            { userName: parent.userName },
            { balance: amount },
          );
        });
      } catch (err) {
        reject(err);
      }
      resolve();
    });
  }

  /**
   * Get License Bonus Percentage of Plan For Specific Level
   * @param planName
   * @param level
   */
  private async getBonusPercentage(planName: string, level: number) {
    let percentage: number;
    let row: LicenseFee;
    switch (planName) {
      case PlanNameEnum.Silver:
        row = await this.licenseRepository.findOne({ levelNo: level });
        percentage = row.silverPercentage;
        break;
      case PlanNameEnum.Gold:
        row = await this.licenseRepository.findOne({ levelNo: level });
        percentage = row.goldPercentage;
        break;
      case PlanNameEnum.Platinum:
        row = await this.licenseRepository.findOne({ levelNo: level });
        percentage = row.platinumPercentage;
        break;
      case PlanNameEnum.Premium:
        row = await this.licenseRepository.findOne({ levelNo: level });
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
    const amountToMultiplyWith = percentage / 100;
    const originalAmount = amountToMultiplyWith * amount;
    return originalAmount;
  }
}
