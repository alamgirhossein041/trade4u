import { Column, Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Bot } from './bot.entity';
import { Slot } from './slot.entity';

@Entity({
  name: 'trades',
})
export class Trade {
  @PrimaryColumn()
  tid: string;

  @Column()
  date: string;

  @Column()
  amount: string;

  @Column()
  profit: string;

  @Column()
  profitpercentage: string;

  @Column()
  status: string;

  @ManyToOne(() => Slot)
  @JoinColumn({ name: 'slotid' })
  slot: Slot;
}
