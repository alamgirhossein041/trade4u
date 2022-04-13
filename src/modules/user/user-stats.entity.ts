import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../utils/base.entity';

@Entity('user_stats')
export class UserStats extends BaseEntity {
  @Column({
    default: 0,
  })
  total_affiliates: number;

  @Column({
    default: 0,
  })
  depth_level: number;

  @Column({
    default: 0,
    type: 'double precision',
  })
  earning_limit: number;

  @Column({
    default: 0,
    type: 'double precision',
  })
  consumed_amount: number;

  @Column({
    default: 0,
    type: 'double precision',
  })
  unconsumed_amount: number;
}
