import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'performance_fees' })
export class PerformanceFee {
  @PrimaryColumn()
  levelNo: number;

  @Column({ type: 'double precision' })
  silverPercentage: number;

  @Column({ type: 'double precision' })
  goldPercentage: number;

  @Column({ type: 'double precision' })
  platinumPercentage: number;

  @Column({ type: 'double precision' })
  premiumPercentage: number;
}
