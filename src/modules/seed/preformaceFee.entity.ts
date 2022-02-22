import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class PerformanceFee {
  @PrimaryColumn()
  levelNo: Number;

  @Column({ type: 'double precision' })
  silverPercentage: Number;

  @Column({ type: 'double precision' })
  goldPercentage: Number;

  @Column({ type: 'double precision' })
  platinumPercentage: Number;
}
