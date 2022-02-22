import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../utils/base.entity';
import { User } from '../user/user.entity';
import { BasePlanDto } from './commons/plan.dtos';

@Entity({
  name: 'plans',
})
export class Plan extends BaseEntity {
  @Column({ length: 255 })
  planName: string;

  @Column()
  price: number;

  @Column()
  levels: number;

  @Column({ default: '3X' })
  earningLimit: string;

  @Column({ type: 'double precision' })
  minUSDT: number;

  @Column({ type: 'double precision' })
  minBTC: number;

  @OneToMany(() => User, (user) => user.plan)
  public users: User[];

  fromDto(body: BasePlanDto): Plan {
    this.planName = body.planName;
    this.price = body.price;
    this.levels = body.levels;
    this.earningLimit = body.earningLimit;
    this.minBTC = body.minBTC;
    this.minUSDT = body.minUSDT;

    return this;
  }
}
