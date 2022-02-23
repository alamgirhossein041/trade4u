import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({name: `plans`})
export class Plan {
  @PrimaryColumn()
  planId: Number;

  @Column({})
  planName: string;

  @Column({ type: 'double precision' })
  price: Number;

  @Column({ type: 'double precision' })
  minBTC: Number;

  @Column({ type: 'double precision' })
  minUSDT: Number;

  @Column()
  levels: Number;

  @Column()
  preformanceFeePercentage: Number;

  @Column()
  directBonusPercentage: Number;

  @Column()
  directPreformanceBonusPercentage: Number;
}
