import { Account } from '../klaytn/account.entity';
import { Column, Entity, JoinColumn, PrimaryColumn, ManyToOne } from 'typeorm';
import { TransactionReceipt } from 'caver-js';

@Entity({
  name: 'deposits',
})
export class Deposit {
  @PrimaryColumn()
  txHash: string;

  @Column()
  fromAddress: string;

  @Column({
    type: 'double precision',
  })
  amount: number;

  @Column()
  blockHeight: number;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account' })
  account: Account;

  fromTransaction(tx: TransactionReceipt) {
    this.txHash = tx.transactionHash;
    this.blockHeight = Number(tx.blockNumber);
    this.fromAddress = tx.from;
    this.amount = Number(tx.value);
    return this;
  }
}
