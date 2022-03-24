import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Account } from './account.entity';
import Caver, { KeyringContainer } from 'caver-js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JOB } from '../../modules/scheduler/commons/scheduler.enum';
import { LoggerService } from '../../utils/logger/logger.service';
import Level from 'level-ts';

@Injectable()
export class KlaytnService {
  /**
   * The octect client
   */
  caver: Caver;

  /**
   * level db keyStore
   */
  static keyStore: Level;

  /**
   * Wallet
   */
  wallet: KeyringContainer;

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly loggerService: LoggerService,
  ) {
    this.caver = new Caver(process.env.KLAYTN_NODE_URL);
    KlaytnService.keyStore = new Level(process.env.KEY_STORE_PATH);
    this.wallet = this.caver.wallet;
    (async () => {
      await this.syncWallet();
    })();
  }

  /**
   * Get account
   */
  public async getAccount(queryRunner: QueryRunner): Promise<Account> {
    return new Promise<Account>(async (resolve, reject) => {
      try {
        let account = await this.accountRepository.findOne({ isHalt: false });
        if (!account) account = await this.generateAccount(queryRunner);
        account = await this.haltAccount(account, queryRunner);
        return resolve(account);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Halt a account
   * @returns
   */
  public async haltAccount(account: Account, queryRunner: QueryRunner) {
    account.isHalt = true;
    return await queryRunner.manager.save(account);
  }

  /**
   * Free a account
   * @returns
   */
  public async freeAccount(account: Account) {
    account.isHalt = false;
    return await this.accountRepository.save(account);
  }

  /**
   * Generate new account
   * @returns
   */
  public async generateAccount(queryRunner: QueryRunner): Promise<Account> {
    return new Promise<Account>(async (resolve, reject) => {
      try {
        const keyring = this.caver.wallet.keyring.generate();
        await KlaytnService.keyStore.put(
          keyring.address,
          keyring.key.privateKey,
        );
        const account = await this.saveAccount(keyring.address, queryRunner);
        this.wallet.add(keyring);

        resolve(account);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Get Halted Account List
   * @returns Accounts[]
   */
  public async getHaltedAccounts(): Promise<Account[]> {
    return new Promise<Account[]>(async (resolve, reject) => {
      try {
        const accounts = await this.accountRepository.find({ isHalt: true });
        resolve(accounts);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Save address to database
   */
  public async saveAccount(address: string, queryRunner: QueryRunner) {
    const account = new Account();
    account.address = address;
    account.isHalt = false;

    return await queryRunner.manager.save(account);
  }

  /**
   * Sync wallet (inmemory ~ db)
   */
  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: JOB.WALLET_SYNC,
  })
  public async syncWallet() {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const accounts = await this.getHaltedAccounts();
        await Promise.all(
          accounts.map(async (m) => {
            const exist = this.wallet.isExisted(m.address);
            if (!exist) {
              const sk = await KlaytnService.keyStore.get(m.address);
              this.wallet.newKeyring(m.address, sk);
            }
            this.loggerService.log(`Listening at: ${m.address}`);
          }),
        );
        resolve();
      } catch (err) {
        this.loggerService.error(`Errow while wallet sync job`);
        reject(err);
      }
    });
  }
  /**
   * validate Klaytn Address
   */
  public async validateKlaytnAddress(address: string) {
    if (this.caver.utils.isValidPublicKey(address) === true) {
      return true;
    } else {
      return false;
    }
  }
}
