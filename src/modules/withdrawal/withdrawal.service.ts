import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import bigDecimal from 'js-big-decimal';
import { CaverService } from '../../modules/klaytn/caver.service';
import { PriceService } from '../../modules/price/price.service';
import { User, UsersService } from '../../modules/user';
import { getConnection, QueryRunner } from 'typeorm';
import { LoggerService } from '../../utils/logger/logger.service';
import { JOB } from '../../utils/enum';

@Injectable()
export class WithdrawalService {

    constructor(
        private readonly userService: UsersService,
        private readonly caverService: CaverService,
        private readonly loggerService: LoggerService,

    ) {
    }

    @Cron(CronExpression.EVERY_MINUTE, {
        name: JOB.WITHDRAWAL,
    })
    public async withdrawal() {
        const balance = PriceService.klayPrice * Number(process.env.KLAY_TRANSFER_AT);
        const users = await this.userService.getUsersForWithDrawal(balance);
        if (!users.length)
            return;
        else {
            return await Promise.all(users.map(m => this.withdrawalTransaction(m)));
        }
    }

    /**
     * withdraw from master wallet to user wallet.
     * @returns 
     */
    public async withdrawalTransaction(user: User) {
        return new Promise<void>(async (resolve, reject) => {
            // get a connection and create a new query runner
            const connection = getConnection();
            const queryRunner = connection.createQueryRunner();
            // establish real database connection using our new query runner
            await queryRunner.connect();
            // lets now open a new transaction:
            await queryRunner.startTransaction();
            try {
                if (!user.klayWallet) resolve();
                else {
                    this.loggerService.log(`Withdrawal Transaction Started`);
                    const amount = new bigDecimal(user.balance)
                        .divide(new bigDecimal(PriceService.klayPrice), 4)
                        .getValue();

                    await this.updateUserbalance(user, queryRunner);
                    await this.caverService.moveToUserWallet(user.klayWallet, amount);
                }
                await queryRunner.commitTransaction();
            }
            catch (err) {
                // since we have errors let's rollback changes we made
                await queryRunner.rollbackTransaction();
                await queryRunner.release();
                this.loggerService.error(`Error In withdrawal Transaction`);
                reject(err);
            }
            finally {
                // you need to release query runner which is manually created:
                await queryRunner.release();
                this.loggerService.log(`Withdrawal Transaction Completed`);
                resolve();
            }
        });
    }

    public async updateUserbalance(user: User, queryRunner: QueryRunner) {
        user.balance = 0.0000;
        return await queryRunner.manager.save(user);
    }

}
