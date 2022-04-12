import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Bot } from './bot.entity';
import { Band } from './band.entity';
import { Timeframe } from './timeframe.entity';
import { Tradethreshold } from './tradethreshold.entity';

@Entity({
  name: 'slots',
})
export class Slot {
  @PrimaryColumn()
  slotid: string;

  @Column({
    type: 'double precision',
  })
  balancebase: number;

  @Column({
    type: 'double precision',
  })
  balancequote: number;

  @Column({
    default: false,
  })
  consumed: boolean;

  @ManyToOne(() => Bot)
  @JoinColumn({ name: 'botid' })
  bot: Bot;

  @ManyToOne(() => Band)
  @JoinColumn({ name: 'bandid' })
  band: Band;

  @ManyToOne(() => Timeframe)
  @JoinColumn({ name: 'tfid' })
  timeframe: Timeframe;

  @ManyToOne(() => Timeframe)
  @JoinColumn({ name: 'ttid' })
  tradethreshold: Tradethreshold;
}
