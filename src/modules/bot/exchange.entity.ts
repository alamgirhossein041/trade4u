import {
  Column,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity({
  name: 'exchanges',
})
export class Exchange {
  @PrimaryColumn()
  exchangeid: string;

  @Column()
  name: string;

  @Column({
      type: 'double precision'
  })
  comission: number;

  @Column({
      type: 'double precision'
  })
  slippagetolerance: number;

  @Column({
      type: 'double precision'
  })
  bsr: number;
}
