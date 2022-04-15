import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'tradethresholds',
})
export class Tradethreshold {
  @PrimaryColumn({ type: 'varchar' })
  ttid: string;

  @Column({
    type: 'double precision',
  })
  buythreshold: number;

  @Column({
    type: 'double precision',
  })
  sellthreshold: number;
}
