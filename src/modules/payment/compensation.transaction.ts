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
import { LoggerService } from '../../utils/logger/logger.service';
import { Deposit } from './deposit.entity';
import { UserCommision } from '../user/user-commision.entity';

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
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.setContext('CompensationTransaction');
  }

  /**
   * Distribute Bonus Among Parents Of User
   * @param depositCompletedEvent
   * @returns
   */
  @OnEvent(Events.DEPOSIT_COMPLETED, { async: true })
  public async initCompensationTransaction(
    depositCompletedEvent: DepositCompletedEvent,
  ) {
    this.loggerService.log(`Compensation Transaction Started`);
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
        const userParentTree = await this.userService.getUserParentsTree(
          userWithPlan,
        );
        await this.distBonusInParents(
          userParentTree,
          planAmount,
          depositCompletedEvent.bonusType,
          queryRunner,
        );
        await this.updateDepositProcessing(
          depositCompletedEvent.deposit,
          queryRunner,
        );
        await queryRunner.commitTransaction();
      } catch (err) {
        // since we have errors let's rollback changes we made
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        this.loggerService.error(`Error In Compensation Transaction`);
        reject(err);
      } finally {
        // you need to release query runner which is manually created:
        await queryRunner.release();
        this.loggerService.log(`Compensation Transaction Completed`);
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
        await Promise.all(
          parenTree.map(async (parent: any) => {
            const parentToUpdate = await this.userService.get(parent.uuid);
            if (parent.plan_is_active) {
              const bonusPercentage = await this.getBonusPercentage(
                bonusType,
                parent.plan_name,
                parent.level,
                parent.parent_depth_level,
              );
              let amount = this.getBonusAmount(bonusPercentage, planAmount);
              const isEarningLimitExceed = this.isLimitExceed(
                amount,
                parentToUpdate.userStats,
              );
              if (isEarningLimitExceed) {
                await this.createCommision(
                  parentToUpdate,
                  amount,
                  queryRunner,
                  false,
                );
                parentToUpdate.userStats.unconsumed_amount = Number(
                  new bigDecimal(amount)
                    .add(
                      new bigDecimal(
                        parentToUpdate.userStats.unconsumed_amount,
                      ),
                    )
                    .getValue(),
                );
                await queryRunner.manager.save(parentToUpdate.userStats);
              } else {
                await this.updateParentStats(
                  parentToUpdate.userStats,
                  amount,
                  queryRunner,
                );
                await this.createCommision(parentToUpdate, amount, queryRunner);
                parentToUpdate.balance = Number(
                  new bigDecimal(amount)
                    .add(new bigDecimal(parent.balance))
                    .getValue(),
                );
                await queryRunner.manager.save(parentToUpdate);
              }
            }
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
    parentPlanName: string,
    parentLevel: number,
    parentDepthLevel: number,
  ) {
    if (parentLevel > parentDepthLevel) {
      return 0;
    }
    let percentage: number;
    let repository: Repository<LicenseFee | PerformanceFee>;
    if (bonusType === BonusType.PERFORMANCE)
      repository = this.performanceRepository;
    else repository = this.licenseRepository;
    let row: LicenseFee | PerformanceFee;
    row = await repository.findOne({ levelNo: parentLevel });
    switch (parentPlanName) {
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
  private getBonusAmount(percentage: number, planAmount: number) {
    const amountToMultiplyWith = Number(
      new bigDecimal(percentage).divide(new bigDecimal(100), 4).getValue(),
    );
    const originalAmount = Number(
      new bigDecimal(amountToMultiplyWith)
        .multiply(new bigDecimal(planAmount))
        .getValue(),
    );
    return originalAmount;
  }

  /**
   * Check If Earing Limit Exceeds After adding this bonus
   * @param parentStats
   * @param amount
   */
  private isLimitExceed(amount: number, parentStats: UserStats) {
    const newConsumed = Number(
      new bigDecimal(amount)
        .add(new bigDecimal(parentStats.consumed_amount))
        .getValue(),
    );
    const amountToMultiplyWith = Number(
      new bigDecimal(newConsumed)
        .divide(new bigDecimal(parentStats.earning_limit), 4)
        .getValue(),
    );
    const originalPercentage = Number(
      new bigDecimal(amountToMultiplyWith)
        .multiply(new bigDecimal(100))
        .getValue(),
    );
    if (originalPercentage >= 95) {
      return true;
    } else {
      return false;
    }
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
   * Create A Commision For Parent User
   * @param parent
   * @param amount
   * @param queryRunner
   * @returns
   */
  private async createCommision(
    parent: User,
    amount: number,
    queryRunner: QueryRunner,
    consumed: boolean = true,
  ) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const commision = new UserCommision();
        commision.amount = amount;
        commision.user = parent;
        commision.consumed = consumed;
        await queryRunner.manager.save(commision);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Update Deposit Processing
   * @param txHash
   * @param queryRunner
   * @returns
   */
  private async updateDepositProcessing(
    deposit: Deposit,
    queryRunner: QueryRunner,
  ) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        deposit.processed = true;
        await queryRunner.manager.save(deposit);
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
