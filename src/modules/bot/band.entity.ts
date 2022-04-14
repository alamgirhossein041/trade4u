import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'bands',
})
export class Band {
  @PrimaryColumn({ type: 'varchar' })
  bandid: string;

  @Column({
    type: 'double precision',
  })
  minvalue: number;

  @Column({
    type: 'double precision',
  })
  maxvalue: number;

  @Column()
  slotpercentage: string;

  @Column()
  baseasset: string;

  @Column()
  quoteasset: string;
}
