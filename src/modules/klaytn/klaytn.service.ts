import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Account } from './account.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JOB } from '../../utils/enum/index';
import { LoggerService } from '../../utils/logger/logger.service';
import { Level } from 'level';
import WebSocket, { WebSocketServer } from 'ws';
import { Attempts, BlockQueue } from '../scheduler/commons/scheduler.enum';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Information } from './information.entity';
import { InformationEnum } from './commons/klaytn.enum';
import { CaverService } from './caver.service';
import { async } from 'rxjs';

@Injectable()
export class KlaytnService {

  /**
   * Level db keyStore
   */
  static keyStore: Level;

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
    private readonly caverService: CaverService,
    @InjectQueue(BlockQueue.BLOCK)
    private readonly blockQueue: Queue,
    @InjectRepository(Information)
    private readonly informationRepository: Repository<Information>,
  ) {
    KlaytnService.keyStore = new Level(process.env.KEY_STORE_PATH);
    this.wsClient = new WebSocket(process.env.KLAYTN_NODE_WS);
    (async () => {
      let promises = [];
      await this.syncWallet();
      if (this.listeners.length && process.env.ENABLE_RECOVERY === 'true') promises.push(this.syncDeposits());
      promises.push(this.subscribeNewHead());
      return await Promise.all(promises);
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
        this.caverService.newKeyRing(account.address, sk);
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
        const keyring = this.caverService.generateKeyRing();
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
            const exist = this.caverService.isWalletAddressExisted(m.address);
            if (!exist) {
              const sk = await KlaytnService.keyStore.get(m.address);
              this.caverService.newKeyRing(m.address, sk);
              this.listeners.push(m.address);
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
    return this.caverService.isAddress(address);
  }

  /**
   * Subscribe newHead event of klaytn network
   */
  public async subscribeNewHead() {
    this.wsClient.on('open', async () => {
      await this.wsClient.send(
        '{"jsonrpc":"2.0", "id": 1, "method": "klay_subscribe", "params": ["newHeads"]}',
      );
    });

    this.wsClient.on('message', async (data) => {
      const parsed = JSON.parse(data);
      if (!parsed.params) return;

      if (this.listeners.length) {
        const blockHeight = this.caverService.hexToNumber(
          parsed.params.result.number,
        );
        this.loggerService.log(`Block recieved: ${blockHeight}`);
        await this.addBlock(parsed.params?.result);
        await this.updateBlockHeight(Number(blockHeight));
      }
      return;
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
    return this.caverService.getAccountBalance(address);
  }

  /**
   * Sync Blocks (Klaytn Web Socket)
   */
  public async syncDeposits() {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const lastProcessedBlock = await this.getLastProcessedBlock();
        if (lastProcessedBlock) {
          const lastProcessedBlockHeight = Number(lastProcessedBlock.value);
          this.loggerService.log(
            `Last Processed Block: ${lastProcessedBlockHeight}`,
          );
          const latestBlockHeight = await this.caverService.getLatestBlock();
          this.loggerService.log(`Latest Block: ${latestBlockHeight}`);
          if (lastProcessedBlockHeight < latestBlockHeight) {
            for (let i = lastProcessedBlockHeight; i < latestBlockHeight; i++) {
              const blockNumber = i + 1;
              const block = await this.caverService.getBlock(blockNumber);
              await this.addBlock(block);
              this.loggerService.log(`Recover Missed Block: ${blockNumber}`);
            }
          }
          this.loggerService.debug(
            `********** Recovery Process Completed, Block Height = ${latestBlockHeight} **********`,
          );
        }
        resolve();
      } catch (err) {
        this.loggerService.error(`Error while block sync job`);
        reject(err);
      }
    });
  }

  /**
   * Get The Last Block Height Processed By Queue
   * @returns Block
   */
  public async getLastProcessedBlock() {
    const blockHeight = await this.informationRepository.findOne({
      keyName: InformationEnum.HEIGHT,
    });
    return blockHeight;
  }

  /**
   * Save Or Update Last Block Height Locally Coming From WebSocketServer
   * @param height
   * @returns
   */
  public async updateBlockHeight(height: number) {
    const blockHeight = await this.getLastProcessedBlock();
    if (blockHeight) {
      blockHeight.value = height;
      return await this.informationRepository.save(blockHeight);
    }
    const newBlockHeight = new Information();
    newBlockHeight.keyName = InformationEnum.HEIGHT;
    newBlockHeight.value = height;
    return await this.informationRepository.save(newBlockHeight);
  }

  /**
   * Remove a listener
   */
  public removeListener(address) {
    return new Promise<void>((resolve, reject) => {
      try {
        const index = this.listeners.indexOf(address);
        if (index > -1) {
          this.listeners.splice(index, 1);
          this.loggerService.log(`listener removed: ${address}`);
        }
        this.caverService.removeAddressFromWallet(address);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
}
