import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: `plans` })
export class Plan {
  @PrimaryColumn()
  planId: number;

  @Column()
  planName: string;

  @Column({ type: 'double precision' })
  price: number;

  @Column({ type: 'double precision' })
  minBTC: number;

  @Column({ type: 'double precision' })
  minUSDT: number;

  @Column()
  levels: number;

  @Column()
  limit: string;

  @Column()
  preformanceFeePercentage: number;

  @Column()
  directBonusPercentage: number;

  @Column()
  directPreformanceBonusPercentage: number;
}
