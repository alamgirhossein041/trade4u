import { Account } from '../octet/account.entity';
import { Column, Entity, JoinColumn, PrimaryColumn, ManyToOne } from 'typeorm';
import { DepositListInterface } from 'modules/octet/commons/octet.types';
import bigDecimal from 'js-big-decimal';
import { DepositWebHook } from './commons/payment.dtos';

@Entity({
  name: 'deposits',
})
export class Deposit {
  @PrimaryColumn()
  id: number;

  @Column()
  coinSymbol: string;

  @Column()
  fromAddress: string;

  @Column()
  toAddress: string;

  @Column({
    type: 'double precision',
  })
  amount: number;

  @Column()
  txid: string;

  @Column()
  blockHeight: number;

  @Column()
  dwDate: string;

  @Column()
  dwModifiedDate: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account' })
  account: Account;

  fromDepositList(body: DepositListInterface) {
    this.id = body.id;
    this.amount = Number(bigDecimal.round(body.amount, 4));
    this.blockHeight = body.block_height;
    this.coinSymbol = body.coin_symbol;
    this.fromAddress = body.from_address;
    this.toAddress = body.to_address;
    this.txid = body.txid;
    this.dwDate = body.dw_date;
    this.dwModifiedDate = body.dw_modified_date;

    return this;
  }

  fromWebhook(body: DepositWebHook) {
    this.id = body.id;
    this.amount = Number(bigDecimal.round(body.amount, 4));
    this.blockHeight = body.blockHeight;
    this.coinSymbol = body.coinSymbol;
    this.fromAddress = body.fromAddress;
    this.toAddress = body.toAddress;
    this.txid = body.txid;
    this.dwDate = body.dwDate;
    this.dwModifiedDate = body.dwModifiedDate;

    return this;
  }
}
