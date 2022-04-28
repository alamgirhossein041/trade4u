import moment from 'moment';
import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({
  name: 'users_commisions',
})
export class UserCommision {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  affiliate: string;

  @Column({ nullable: true })
  level: string;

  @Column({ nullable: true })
  license_performance: string;

  @Column({ type: 'double precision' })
  amount: number;

  @Column({ type: 'double precision', nullable: true })
  amountKLAY: number;

  @Column({ default: moment().unix() })
  createdAt: number;

  @Column({ default: true })
  consumed: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
