import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Machine } from './machine.entity';

@Entity({
  name: 'bots',
})
export class Bot {
  @PrimaryColumn({ type: 'varchar' })
  botid: string;

  @Column()
  botname: string;

  @Column()
  pid: number;

  @Column()
  strategy: string;

  @Column()
  status: string;

  @Column()
  exchange: string;

  @Column()
  apikey: string;

  @Column()
  apisecret: string;

  @Column()
  risklevel: string;

  @Column()
  baseasset: string;

  @Column()
  quoteasset: string;

  @Column()
  userid: string;

  @Column({ type: 'double precision', nullable: true })
  efficiencyoverall: number;

  @Column({ type: 'double precision', nullable: true })
  efficiencytoday: number;

  @ManyToOne(() => Machine)
  @JoinColumn({ name: 'machineid' })
  machine: Machine;
}
