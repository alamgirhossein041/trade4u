import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Account } from './account.entity';
import Caver, { KeyringContainer } from 'caver-js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JOB } from '../../utils/enum/index';
import { LoggerService } from '../../utils/logger/logger.service';
import Level from 'level-ts';
import WebSocket, { WebSocketServer } from 'ws';
import { Attempts, BlockQueue } from '../scheduler/commons/scheduler.enum';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class KlaytnService {
  /**
   * The octect client
   */
  caver: Caver;

  /**
   * Level db keyStore
   */
  static keyStore: Level;

  /**
   * Caver Wallet
   */
  public wallet: KeyringContainer;

  /**
   * Websocket client
   */
  public wsClient: WebSocket;

  /**
   * Listners of transaction
   */
  public listeners: string[] = [];

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly loggerService: LoggerService,
    @InjectQueue(BlockQueue.BLOCK)
    private readonly blockQueue: Queue,
  ) {
    this.caver = new Caver(process.env.KLAYTN_NODE_URL);
    KlaytnService.keyStore = new Level(process.env.KEY_STORE_PATH);
    this.wallet = this.caver.wallet;
    this.wsClient = new WebSocket(process.env.KLAYTN_NODE_WS);
    (async () => {
      await this.syncWallet();
      await this.subscribeNewHead();
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

        const sk = await KlaytnService.keyStore.get(account.address);
        this.wallet.newKeyring(account.address, sk);
        this.listeners.push(account.address);
        this.loggerService.log(`Listening at: ${account.address}`);
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
            this.listeners.push(m.address);
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
    return this.caver.utils.isAddress(address);
  }  

  /**
   * Subscribe newHead event of klaytn network
   */
  public async subscribeNewHead() {
    this.wsClient.on('open', () => {
      this.wsClient.send(
        '{"jsonrpc":"2.0", "id": 1, "method": "klay_subscribe", "params": ["newHeads"]}',
      );
    });

    this.wsClient.on('message', async (data) => {
      const parsed = JSON.parse(data);
      if (!parsed.params) return;

      const blockHeight = this.caver.utils.hexToNumber(
        parsed.params.result.number,
      );
      this.loggerService.log(`Block recieved: ${blockHeight}`);
      return await this.addBlock(parsed.params?.result);
    });
  }

  /**
   * Add block to block queue
   */
  async addBlock(block) {
    await this.blockQueue.add(
      BlockQueue.BLOCK,
      {
        block,
      },
      {
        removeOnComplete: true,
        attempts: Attempts.THREE,
      },
    );
    return;
  }

  /**
   * Return balance of account
   */
  async getAccountBalance(address: string) {
    const balance = await this.caver.rpc.klay.getBalance(address);
    return this.caver.utils.fromPeb(
      this.caver.utils.hexToNumberString(balance),
    );
  }

  /**
   * Move deposit to master wallet
   */
  public async moveToMasterWallet(address: string) {
    const tx = this.caver.transaction.feeDelegatedValueTransfer.create({
      from: address,
      to: process.env.KLAY_MASTER_WALLET_ADDRESS,
      value: await this.caver.rpc.klay.getBalance(address),
      feePayer: process.env.KLAY_FEE_WALLET_ADDRESS,
      gasPrice: await this.caver.klay.getGasPrice(),
      gas: 3000000,
      nonce: Number(await this.caver.klay.getTransactionCount(address)),
    });

    const sender = this.caver.wallet.getKeyring(address);
    const feepayer = this.caver.wallet.newKeyring(
      process.env.KLAY_FEE_WALLET_ADDRESS,
      process.env.KLAY_FEE_WALLET_SECRET,
    );

    await tx.sign(sender);
    await tx.signAsFeePayer(feepayer);
    await this.caver.klay.sendSignedTransaction(tx.getRawTransaction());
    this.loggerService.debug(
      `Successfully moved: ${address} => ${process.env.KLAY_MASTER_WALLET_ADDRESS} `,
    );
    return;
  }

  /**
   * Remove a listener
   */
  public removeListener(address) {
    const index = this.listeners.indexOf(address);
    if (index > -1) {
      this.listeners.splice(index, 1);
      this.loggerService.log(`listener removed: ${address}`);
    }
  }
}
