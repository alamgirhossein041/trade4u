import { Column, Entity, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Bot } from './bot.entity';

@Entity({
  name: 'summary',
})
export class Summary {
  @PrimaryColumn({ type: 'varchar' })
  sid: string;

  @Column()
  totaltrades: number;

  @Column({
    type: 'double precision',
  })
  totalprofits: number;

  @Column({
    type: 'double precision',
  })
  lastmonthprofits: number;

  @Column({
    type: 'double precision',
  })
  lastthreemonthprofits: number;

  @Column({
    type: 'double precision',
  })
  lastsixmonthprofits: number;

  @Column({
    type: 'double precision',
  })
  lastyearprofits: number;

  @OneToOne(() => Bot)
  @JoinColumn({ name: 'botid' })
  bot: Bot;
}
