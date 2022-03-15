import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Db, QueryRunner, Repository } from 'typeorm';
import { Account } from './account.entity';
import level from 'level-ts';
import Caver from 'caver-js';

@Injectable()
export class KlaytnService {
  /**
   * The octect client
   */
  caver: Caver;

  /**
   * @param
   */
  keyStore: level;

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {
    this.caver = new Caver(
      process.env.KLAYTN_NODE_URL
    );
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
        this.keyStore = new level(process.env.KEY_STORE_PATH);
        const keyring = this.caver.wallet.keyring.generate();
        await this.keyStore.put(keyring.address, keyring.key);
        const account = await this.saveAccount(
          keyring.address,
          queryRunner,
        );
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
  public async getHaltedAcocounts(): Promise<Account[]> {
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
}
