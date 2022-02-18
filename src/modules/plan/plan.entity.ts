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

  @Column()
  directBonusPercentage: number;

  @Column()
  performanceBonusPercentage: number;

  @Column({ type: 'double precision' })
  minimumUSDT: number;

  @Column({ type: 'double precision' })
  minimumBTC: number;

  @OneToMany(() => User, (user) => user.plan)
  public users: User[];

  fromDto(body: BasePlanDto): Plan {
    this.planName = body.planName;
    this.price = body.price;
    this.levels = body.levels;
    this.earningLimit = body.earningLimit;
    this.directBonusPercentage = body.directBonusPercentage;
    this.performanceBonusPercentage = body.performanceBonusPercentage;
    this.minimumBTC = body.minimumBTC;
    this.minimumUSDT = body.minimumUSDT;

    return this;
  }
}
