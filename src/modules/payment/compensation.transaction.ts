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
import { TelegramService } from '../../utils/telegram/telegram-bot.service';
import { PriceService } from '../../modules/price/price.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Events } from '../scheduler/commons/scheduler.enum';
import { DepositCompletedEvent } from '../scheduler/deposit.complete.event';
import { UserStats } from '../user/user-stats.entity';

@Injectable()
export class CompensationTransaction {
  /**
   *
   * @param licenseRepository
   * @param performanceRepository
   * @param userService
   * @param telegramService
   **/
  constructor(
    @InjectRepository(LicenseFee)
    private readonly licenseRepository: Repository<LicenseFee>,
    @InjectRepository(PerformanceFee)
    private readonly performanceRepository: Repository<PerformanceFee>,
    private readonly userService: UsersService,
    private readonly telegramService: TelegramService,
  ) {}

  /**
   * Distribute License Bonus Among Parents Of User
   * @param user
   * @returns
   */
  @OnEvent(Events.DEPOSIT_COMPLETED, { async: true })
  public async initCompensationTransaction(
    depositCompletedEvent: DepositCompletedEvent,
  ) {
    return new Promise<void>(async (resolve, reject) => {
      // get a connection and create a new query runner
      const connection = getConnection();
      const queryRunner = connection.createQueryRunner();
      // establish real database connection using our new query runner
      await queryRunner.connect();
      // lets now open a new transaction:
      await queryRunner.startTransaction();
      try {
        const userWithPlan = await this.userService.get(
          depositCompletedEvent.user.uuid,
        );
        const planAmount = userWithPlan.plan.price;
        const planName = userWithPlan.plan.planName;
        const userParentTree = await this.userService.getUserParentsTree(
          userWithPlan,
        );
        await this.distBonusInParents(
          userParentTree,
          planAmount,
          planName,
          depositCompletedEvent.bonusType,
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
    planName: string,
    bonusType: string,
    queryRunner: QueryRunner,
  ) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await Promise.all(
          parenTree.map(async (parent: any) => {
            const bonusPercentage = await this.getBonusPercentage(
              bonusType,
              planName,
              parent.level,
              parent.parent_depth_level,
            );
            let amount = this.getBonusAmount(bonusPercentage, planAmount);
            const parentToUpdate = await this.userService.get(parent.uuid);
            await this.updateParentStats(
              parentToUpdate.userStats,
              amount,
              queryRunner,
            );
            parentToUpdate.balance = Number(
              new bigDecimal(amount)
                .add(new bigDecimal(parent.balance))
                .getValue(),
            );
            await queryRunner.manager.save(parentToUpdate);
          }),
        );
        resolve();
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
    parentDepthLevel: number,
  ) {
    if (level > parentDepthLevel) {
      return 0;
    }
    let percentage: number;
    let repository: Repository<LicenseFee | PerformanceFee>;
    if (bonusType === BonusType.PERFORMANCE)
      repository = this.performanceRepository;
    else repository = this.licenseRepository;
    let row: LicenseFee | PerformanceFee;
    row = await repository.findOne({ levelNo: level });
    switch (planName) {
      case PlanNameEnum.Silver:
        percentage = row.silverPercentage;
        break;
      case PlanNameEnum.Gold:
        percentage = row.goldPercentage;
        break;
      case PlanNameEnum.Platinum:
        percentage = row.platinumPercentage;
        break;
      case PlanNameEnum.Premium:
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

  /**
   * Update Stats of PArent
   * @param userStats
   * @param consumedAmount
   * @param queryRunner
   * @returns
   */
  private async updateParentStats(
    userStats: UserStats,
    consumedAmount: number,
    queryRunner: QueryRunner,
  ) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        userStats.consumed_amount = Number(
          new bigDecimal(userStats.consumed_amount)
            .add(new bigDecimal(consumedAmount))
            .getValue(),
        );
        await queryRunner.manager.save(userStats);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Notify Parent On Telegram if Parent Notifications are active
   * @param parent
   * @returns
   */
  private async notifyParentOnTelegram(
    parent: User,
    txHash: string,
    amountUSD: number,
  ) {
    const parentWithDetail = await this.userService.get(parent.uuid);
    if (
      parentWithDetail.userTelegram &&
      parentWithDetail.userTelegram.isActive
    ) {
      const parentTelegram = parentWithDetail.userTelegram;
      if (parentTelegram.bonusNotificationsActive) {
        const amountKLAY = Number(
          new bigDecimal(amountUSD)
            .divide(new bigDecimal(PriceService.klayPrice), 8)
            .getValue(),
        );
        await this.telegramService.sendBonusNotification(
          parentTelegram,
          txHash,
          PriceService.klayPrice,
          amountKLAY,
          amountUSD,
          BonusType.LISENCE,
        );
        return;
      }
    }
    return;
  }
}
