import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'portfoliozones',
})
export class Portfoliozone {
  @PrimaryColumn()
  pfid: string;

  @Column()
  asset: string;

  @Column({
    type: 'double precision',
  })
  minbalance: number;

  @Column({
    type: 'double precision',
  })
  maxbalance: number;

  @Column()
  allowedslots: number;
}
