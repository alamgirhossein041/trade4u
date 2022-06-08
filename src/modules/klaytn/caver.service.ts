import { Inject, Injectable } from '@nestjs/common';
import Caver, { Keyring, KeyringContainer } from 'caver-js';
import { LoggerService } from '../../utils/logger/logger.service';
import { GcpSecretService } from '../../utils/secret-manager/gcp.sm.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class CaverService {
  /**
   * The caver client
   */
  private caver: Caver;

  /**
   * The caver wallet
   */
  private wallet: KeyringContainer;

  private FEE_WALLET_SECRET: string;
  private MASTER_WALLET_SECRET: string;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly loggerService: LoggerService,
    private readonly secretService: GcpSecretService,
  ) {
    this.caver = new Caver(process.env.KLAYTN_NODE_URL);
    this.wallet = this.caver.wallet;
    (async () => {
      const [feeSecret, masterSecret] = await Promise.all([
        this.secretService.getWalletSecret(process.env.GCP_FEE_WALLET_SECRET),
        this.secretService.getWalletSecret(
          process.env.GCP_MASTER_WALLET_SECRET,
        ),
      ]);
      this.FEE_WALLET_SECRET = feeSecret;
      this.MASTER_WALLET_SECRET = masterSecret;
    })();
  }

  /**
   *
   * @param address
   * @param sk
   * @returns
   */
  public newKeyRing(address: string, sk: string) {
    return this.wallet.newKeyring(address, sk);
  }

  /**
   *
   * @returns
   */
  public generateKeyRing() {
    return this.wallet.keyring.generate();
  }

  /**
   *
   * @param address
   * @returns
   */
  public isWalletAddressExisted(address: string) {
    return this.wallet.isExisted(address);
  }

  /**
   *
   * @returns
   */
  public async getLatestBlock() {
    const latestBlock = await this.caver.klay.getBlockNumber();
    return latestBlock;
  }

  /**
   *
   * @param blockNumber
   * @returns
   */
  public async getBlock(blockNumber: number) {
    return await this.caver.rpc.klay.getBlock(blockNumber);
  }

  /**
   *
   * @param blockNumber
   * @returns
   */
  public async getBlockTransactionCount(blockNumber: number) {
    const txs = await this.caver.rpc.klay.getBlockTransactionCountByNumber(
      blockNumber,
    );
    return txs;
  }

  /**
   *
   * @param blockHash
   * @returns
   */
  public async getBlockReceipts(blockHash: string) {
    const receipts = await this.caver.klay.getBlockReceipts(blockHash);
    return receipts;
  }

  /**
   *
   * @param txHash
   * @returns
   */
  public async getTransactionReceipt(txHash: string) {
    const receipt = await this.caver.klay.getTransactionReceipt(txHash);
    return receipt;
  }

  /**
   *
   * @param hexString
   * @returns
   */
  public hexToNumber(hexString: string) {
    return Number(this.caver.utils.hexToNumber(hexString));
  }

  /**
   *
   * @param address
   */
  public removeAddressFromWallet(address: string) {
    return this.wallet.remove(address);
  }

  /**
   *
   * @param address
   * @returns
   */
  async getAccountBalance(address: string) {
    const balance = await this.caver.rpc.klay.getBalance(address);
    return this.caver.utils.fromPeb(
      this.caver.utils.hexToNumberString(balance),
    );
  }

  /**
   *
   * @param pebString
   * @returns
   */
  public fromPeb(peb: string) {
    const klay = this.caver.utils.fromPeb(
      this.caver.utils.hexToNumberString(peb),
    );
    return klay;
  }

  /**
   *
   * @param klayAmount
   * @returns
   */
  public toPeb(klayAmount: number | string) {
    const value = this.caver.utils.toPeb(klayAmount);
    return value.toString();
  }

  public isAddress(address: string) {
    return this.caver.utils.isAddress(address);
  }

  /**
   *
   * @param address
   * @returns
   */
  public async moveToMasterWallet(address: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        let feepayer: Keyring;
        const tx = this.caver.transaction.feeDelegatedValueTransfer.create({
          from: address,
          to: process.env.KLAY_MASTER_WALLET_ADDRESS,
          value: await this.caver.rpc.klay.getBalance(address),
          feePayer: process.env.KLAY_FEE_WALLET_ADDRESS,
          gasPrice: await this.caver.klay.getGasPrice(),
          gas: 0,
          nonce: Number(await this.caver.klay.getTransactionCount(address)),
        });

        const gasLimit = await this.caver.klay.estimateGas(tx);
        tx.gas = gasLimit.toString();
        const sender = this.caver.wallet.getKeyring(address);
        const exist = this.wallet.isExisted(
          process.env.KLAY_FEE_WALLET_ADDRESS,
        );
        feepayer = exist
          ? this.caver.wallet.getKeyring(process.env.KLAY_FEE_WALLET_ADDRESS)
          : this.caver.wallet.newKeyring(
              process.env.KLAY_FEE_WALLET_ADDRESS,
              this.FEE_WALLET_SECRET,
            );

        await tx.sign(sender);
        await tx.signAsFeePayer(feepayer);
        await this.caver.klay.sendSignedTransaction(tx.getRawTransaction());
        this.loggerService.debug(
          `Successfully moved: ${address} => ${process.env.KLAY_MASTER_WALLET_ADDRESS} `,
        );
        return resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   *
   * @param address
   * @returns
   */
  public async moveToUserWallet(
    address: string,
    amount: string,
  ): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        let feepayer: Keyring;
        let sender: Keyring;
        const tx = this.caver.transaction.feeDelegatedValueTransfer.create({
          from: process.env.KLAY_MASTER_WALLET_ADDRESS,
          to: address,
          value: this.toPeb(amount),
          feePayer: process.env.KLAY_FEE_WALLET_ADDRESS,
          gasPrice: await this.caver.klay.getGasPrice(),
          gas: 0,
          nonce: Number(
            await this.caver.klay.getTransactionCount(
              process.env.KLAY_MASTER_WALLET_ADDRESS,
            ),
          ),
        });

        const gasLimit = await this.caver.klay.estimateGas(tx);
        tx.gas = gasLimit.toString();

        const senderExist = this.wallet.isExisted(
          process.env.KLAY_MASTER_WALLET_ADDRESS,
        );
        sender = senderExist
          ? this.caver.wallet.getKeyring(process.env.KLAY_MASTER_WALLET_ADDRESS)
          : this.caver.wallet.newKeyring(
              process.env.KLAY_MASTER_WALLET_ADDRESS,
              this.MASTER_WALLET_SECRET,
            );

        const feepayerExist = this.wallet.isExisted(
          process.env.KLAY_FEE_WALLET_ADDRESS,
        );
        feepayer = feepayerExist
          ? this.caver.wallet.getKeyring(process.env.KLAY_FEE_WALLET_ADDRESS)
          : this.caver.wallet.newKeyring(
              process.env.KLAY_FEE_WALLET_ADDRESS,
              this.FEE_WALLET_SECRET,
            );

        await tx.sign(sender);
        await tx.signAsFeePayer(feepayer);
        await this.caver.klay.sendSignedTransaction(tx.getRawTransaction());
        this.loggerService.debug(
          `Successfully moved: ${process.env.KLAY_MASTER_WALLET_ADDRESS} => ${address} `,
        );
        return resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
}
