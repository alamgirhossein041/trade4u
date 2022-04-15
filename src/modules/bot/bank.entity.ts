import { Column, Entity, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Bot } from './bot.entity';

@Entity({
  name: 'bank',
})
export class Bank {
  @PrimaryColumn({ type: 'varchar' })
  bid: string;

  @Column({
    type: 'double precision',
  })
  total: number;

  @Column({
    type: 'double precision',
  })
  available: number;

  @Column({
    type: 'double precision',
  })
  hold: number;

  @Column({
    type: 'double precision',
  })
  usage: number;

  @OneToOne(() => Bot)
  @JoinColumn({ name: 'botid' })
  bot: Bot;
}
