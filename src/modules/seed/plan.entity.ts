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
  limit: number;

  @Column({ type: 'double precision' })
  preformanceFeePercentage: number;

  @Column({ type: 'double precision' })
  directBonusPercentage: number;

  @Column({ type: 'double precision' })
  directPreformanceBonusPercentage: number;
}
