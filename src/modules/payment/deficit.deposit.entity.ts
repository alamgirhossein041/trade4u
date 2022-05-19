import { User } from '../user/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn
} from 'typeorm';
import { Payment } from './payment.entity';

@Entity({
  name: 'deficit_deposits'
})
export class DeficitDeposit {
  @PrimaryColumn()
  txHash: string;

  @Column({ type: 'double precision' })
  deficitAmount: number;

  @OneToOne(() => Payment)
  @JoinColumn({ name: 'payment' })
  payment: Payment;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
