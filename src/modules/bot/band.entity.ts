import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'bands',
})
export class Band {
  @PrimaryColumn()
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
  baseasset: number;

  @Column()
  quoteasset: number;
}
