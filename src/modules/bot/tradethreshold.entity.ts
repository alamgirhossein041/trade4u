import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Timeframe } from './timeframe.entity';

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

  @ManyToOne(() => Timeframe)
  @JoinColumn({ name: 'tfid' })
  timeframe: Timeframe;
}
