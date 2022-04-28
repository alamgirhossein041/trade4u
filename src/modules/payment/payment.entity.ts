import { Account } from '../klaytn/account.entity';
import { Plan } from '../seed/plan.entity';
import { User } from '../user/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { PaymentType } from './commons/payment.enum';

@Entity({
  name: 'payments',
})
export class Payment {
  @PrimaryColumn()
  paymentId: string;

  @Column({
    type: 'double precision',
  })
  amountUSD: number;

  @Column({
    type: 'double precision',
  })
  amountKLAY: number;

  @Column()
  status: string;

  @Column()
  type: string;

  @Column({
    nullable: true,
  })
  pdf: string;

  @Column()
  createdAt: number;

  @Column()
  expireAt: number;

  @Column({
    nullable: true,
  })
  paidAt: number;

  @OneToOne(() => Account)
  @JoinColumn({ name: 'account' })
  account: Account;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan' })
  plan: Plan;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user' })
  user: User;
}
