import {
  Column,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity({
  name: 'bots',
})
export class Bot {
  @PrimaryColumn()
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
}
