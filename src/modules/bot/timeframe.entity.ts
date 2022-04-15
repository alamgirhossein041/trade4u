import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'timeframes',
})
export class Timeframe {
  @PrimaryColumn()
  tfid: string;

  @Column()
  duration: string;
}
