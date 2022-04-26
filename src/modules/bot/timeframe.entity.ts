import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'timeframes',
})
export class Timeframe {
  @PrimaryColumn({ type: 'varchar' })
  tfid: string;

  @Column()
  duration: string;

  @Column({ type: 'double precision',nullable: true })
  slotprecentage: number;
}
