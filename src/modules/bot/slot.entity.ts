import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Bot } from './bot.entity';
import { Band } from './band.entity';
import { Timeframe } from './timeframe.entity';
import { Tradethreshold } from './tradethreshold.entity';

@Entity({
  name: 'slots',
})
export class Slot {
  @PrimaryColumn({ type: 'varchar' })
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

  @Column({type: 'bigint',nullable:true})
  createtime: number
  
  @Column({type: 'bigint',nullable:true})
  updatetime: number

  @ManyToOne(() => Bot)
  @JoinColumn({ name: 'botid' })
  bot: Bot;

  @ManyToOne(() => Band)
  @JoinColumn({ name: 'bandid' })
  band: Band;

  @ManyToOne(() => Timeframe)
  @JoinColumn({ name: 'tfid' })
  timeframe: Timeframe;

  @ManyToOne(() => Tradethreshold)
  @JoinColumn({ name: 'ttid' })
  tradethreshold: Tradethreshold;
}
