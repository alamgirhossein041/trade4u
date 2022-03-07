import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosInstance } from 'axios';
import { Repository } from 'typeorm';
import { Account } from './account.entity';
import { CURRENCY } from './commons/octet.enum';
import { DepositListInterface } from './commons/octet.types';

@Injectable()
export class OctetService {
  /**
   * The octect client
   */
  octectClient: AxiosInstance;

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {
    this.octectClient = axios.create({
      baseURL: process.env.OCTET_SERVER_URL,
      headers: {
        Authorization: process.env.OCTET_AUTH_KEY,
      },
      timeout: 10000,
    });
  }

  /**
   * Get account
   */
  public async getAccount(): Promise<Account> {
    return new Promise<Account>(async (resolve, reject) => {
      try {
        let account = await this.accountRepository.findOne({ isHalt: false });
        if (!account) account = await this.generateAccount();
        account = await this.haltAccount(account)
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
  public async haltAccount(account: Account) {
    account.isHalt = true;
    return await this.accountRepository.save(account, { transaction: false });
  }

  /**
   * Generate new account
   * @returns
   */
  public async generateAccount(): Promise<Account> {
    return new Promise<Account>(async (resolve, reject) => {
      try {
        const response = await this.octectClient.post(
          `/${CURRENCY.KLAYTN}/address`,
        );
        const account = await this.saveAccount(response.data.addresses[0]);
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
        const accounts = await this.addressRepository.find({ isHalt: true });
        resolve(accounts);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Get Account Deposit List
   * @returns
   */
  public async getAccountDepositList(
    address: string,
  ): Promise<DepositListInterface[]> {
    return new Promise<DepositListInterface[]>(async (resolve, reject) => {
      try {
        const response = await this.octectClient.get(
          `/${CURRENCY.KLAYTN}/tx/list?address=0x4a1a5db115C269453bF68446c77Dd14e3a90FBFe&pos=0&offset=200`,
        );
        const list = response.data;
        resolve(list);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Save address to database
   */
  public async saveAccount(data: any) {
    const account = new Account();
    account.position = data.keyIndex;
    account.address = data.address;
    account.isHalt = false;

    return await this.accountRepository.save(account, { transaction: false });
  }
}
