import { Column, PrimaryColumn, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Slot } from './slot.entity';

@Entity({
  name: 'orders',
})
export class Order {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'bigint', nullable: true })
  orderid: number;

  @Column()
  symbol: string;

  @Column()
  clientorderid: string;

  @Column()
  price: string;

  @Column()
  origquantity: string;

  @Column()
  executedquantity: string;

  @Column()
  cumulativequotequantity: string;

  @Column()
  status: string;

  @Column()
  timeinforce: string;

  @Column()
  type: string;

  @Column()
  side: string;

  @Column()
  stopprice: string;

  @Column()
  time: string;

  @Column()
  updatetime: string;

  @Column()
  isworking: boolean;

  @Column()
  isisolated: boolean;

  @Column()
  origquoteorderquantity: string;

  @ManyToOne(() => Slot)
  @JoinColumn({ name: 'slotid' })
  slot: Slot;
}
