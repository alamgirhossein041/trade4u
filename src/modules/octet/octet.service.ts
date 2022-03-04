import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosInstance } from 'axios';
import console from 'console';
import { Repository } from 'typeorm';
import { Account } from './account.entity';
import { CURRENCY } from './commons/octet.enum';

@Injectable()
export class OctetService {
  /**
   * The octect client
   */
  octectClient: AxiosInstance;

  constructor(
    @InjectRepository(Account)
    private readonly addressRepository: Repository<Account>,
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
        let account = await this.addressRepository.findOne({ isHalt: false });
        if (!account) account = await this.generateAccount();
        return resolve(account);
      } catch (err) {
        reject(err);
      }
    });
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
   * Save address to database
   */
  public async saveAccount(data: any) {
    const account = new Account();
    account.position = data.keyIndex;
    account.address = data.address;
    account.isHalt = false;

    return await this.addressRepository.save(account);
  }
}
