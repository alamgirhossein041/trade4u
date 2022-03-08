import { Account } from '../../modules/octet/account.entity';
import { Plan } from '../../modules/seed/plan.entity';
import { User } from '../../modules/user';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

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
