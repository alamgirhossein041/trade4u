import { Column, Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Slot } from './slot.entity';

@Entity({
  name: 'trades',
})
export class Trade {
  @PrimaryColumn({ type: 'varchar' })
  tid: string;

  @Column()
  date: number;

  @Column()
  amount: string;

  @Column({
    type: 'double precision',
  })
  profit: number;

  @Column({
    type: 'double precision',
  })
  profitpercentage: number;

  @Column()
  status: string;

  @ManyToOne(() => Slot)
  @JoinColumn({ name: 'slotid' })
  slot: Slot;
}
